import { 
  ExternalServerError,
  InternalServerError,
  UnauthorizedRequestError,
} from '../utils/funcs/errors'
import { Controller } from '../utils/types/generic'
import { Customer, CustomerFile } from '../models'
import axios from 'axios'

import { Dropbox } from 'dropbox'
import { generateCSPRNG } from '../middleware/tokens'

const BASE_URL = process.env.BASE_URL
const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET
const DROPBOX_REDIRECT_URI = process.env.DROPBOX_REDIRECT_URI
const DROPBOX_SCOPE = process.env.DROPBOX_SCOPE

const dropbox = new Dropbox({
  clientId: DROPBOX_CLIENT_ID,
  clientSecret: DROPBOX_CLIENT_SECRET,
})

export const customerFiles: Controller = {
  authDropbox: async (_req, res) => {
    try {
      const state = generateCSPRNG()
      // Redirect user to Dropbox authorization page
      const authUrl = `https://www.dropbox.com/oauth2/authorize?` + 
        `client_id=${DROPBOX_CLIENT_ID}&` +
        `redirect_uri=${BASE_URL}${DROPBOX_REDIRECT_URI}&` + 
        `response_type=code&` +
        `state=${state}`;
      res.json({ auth_url: authUrl });
    } catch (err: Error | unknown) {
      InternalServerError("read", "dropbox authentication url", res, err);
    }
  },

  authDropboxCallback: async (req, res) => {
    try {
      const { code, state } = req.query
      console.log(code, state)

      if (!code || !state) {
        UnauthorizedRequestError("Code and state", res)
      }
      
      const response = await axios.post('https://www.dropbox.com/oauth2/token', {
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${BASE_URL}${DROPBOX_REDIRECT_URI}`,
        client_id: DROPBOX_CLIENT_ID,
        client_secret: DROPBOX_CLIENT_SECRET,
      });
  
      const accessToken = response.data.access_token;
      res.json({ access_token: accessToken });
    } catch (err) {

      console.log('err')
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