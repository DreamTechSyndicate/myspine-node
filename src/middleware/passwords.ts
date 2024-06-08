// import { generateResetToken } from "./tokens";
// import {
//   UnauthorizedRequestError,
//   InternalServerError
// } from '../utils/funcs/errors'
// import {
//   User,
//   UserToken
// } from '../models'

// export const handleForgotPassword = async(req: any, res: any) => {
//   const { email } = req.body;

//   try {
//     const user = await User.readByEmail(email);

//     if (!user) {
//       return UnauthorizedRequestError("email", res);
//     }

//     const resetToken = await generateResetToken();
//     const resetTokenExpirationDate = new Date();

//     resetTokenExpirationDate.setHours(resetTokenExpirationDate.getHours() + 24); // Expires in 24 hours

//     await UserToken.create({
//       user_id: user.id,
//       reset_password_token: resetToken,
//       reset_password_token_expiration_date: resetTokenExpirationDate
//     });

//     // Send the reset token to the user via email or other means
//     res.json({ message: "Reset token sent to email" });
//   } catch (err) {
//     InternalServerError("forgot", "password", res, err);
//   }
// };

// export const handleResetPassword = async(req: any, res: any) => {
//   const { resetToken, newPassword } = req.body;

//   try {
//     const userToken = await UserToken.readByRefreshToken(resetToken);

//     if (!userToken) {
//       return UnauthorizedRequestError("reset token", res);
//     }

//     if (userToken.reset_password_token_expiration_date! < new Date()) {
//       return UnauthorizedRequestError("reset token expired", res);
//     }

//     const user = await User.readById(userToken.user_id);

//     if (!user) {
//       return UnauthorizedRequestError("user", res);
//     }

//     // Update the user's password
//     await User.update(user.id, newPassword);

//     // Delete the reset token
//     await UserToken.delete(userToken.user_id);

//     res.json({ message: "Password reset successfully" });
//   } catch (err) {
//     InternalServerError("reset password", "user", res, err);
//   }
// };