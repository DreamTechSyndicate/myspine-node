import { 
  ExternalServerError,
  InternalServerError,
  UnauthorizedRequestError,
} from '../utils/funcs/errors'
import { Controller } from '../utils/types/generic'
import { Customer, CustomerFile } from '../models'
import axios from 'axios'

const BASE_URL = process.env.BASE_URL
const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET

export const customerFiles: Controller = {
  auth: async (_req, res) => {
    try {
      // Redirect user to Dropbox authorization page
      const authUrl = `https://www.dropbox.com/oauth2/authorize?` + 
        `client_id=${DROPBOX_CLIENT_ID}&` +
        `redirect_uri=${BASE_URL}/auth/dropbox/callback&` + 
        `response_type=code&` +
        `state=RANDOM_STATE`;
      
      res.redirect(authUrl);
      // User should be redirected to Dropbox authorization page
    } catch (err: Error | unknown) {
      InternalServerError("auth", "customer file", res, err);
    }
  },

  authCallback: async (req, res) => {
    try {
      const { code, state } = req.query

      if (!code || !state) {
        UnauthorizedRequestError("Code and state", res)
      }
      
      const response = await axios.post('https://www.dropbox.com/oauth2/token', {
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${BASE_URL}/auth/dropbox/callback`,
        client_id: DROPBOX_CLIENT_ID,
        client_secret: DROPBOX_CLIENT_SECRET,
      });
  
      const accessToken = response.data.access_token;
      res.json({ access_token: accessToken });
    } catch (err) {
      ExternalServerError("Dropbox", res)
    }
  },

  upload: async (req, res) => {
    try {
      const { customer_id } = req.body;
      const customerId = parseInt(customer_id)

      const file = req.files.file;
      const accessToken = req.headers.authorization.split(' ')[1];
    
      // Upload file to Dropbox
      const formData = new FormData();
      formData.append('file', file);
    
      const response = await axios.post('https://content.dropboxapi.com/2/files/upload', formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
          'Dropbox-API-Arg': JSON.stringify({
            path: `/upload/${file.name}`,
            mode: 'add',
            autorename: true,
            mute: false,
          }),
        },
      });

      console.log('response:', response)

      const dropboxFileId = response.data.id;
      const dropboxFileUrl = response.data.url;

      const payload = {
        file_name: file.name,
        file_type: file.mimetype,
        file_size: file.size,
        dropbox_file_id: dropboxFileId,
        dropbox_file_url: dropboxFileUrl,
      };

      console.log('payload:', payload)

      const existingCustomer = customerId && await Customer.readById(customerId)
      
      if (existingCustomer) {        
        await CustomerFile.update({ customerId: existingCustomer!.id, payload })
      } else {
        await CustomerFile.create(payload);
      }
      
      res.status(201).json({ message: "File uploaded successfully "})
    } catch (err: Error | unknown) {
      InternalServerError("create", "customer file", res, err);
    }
  },
}