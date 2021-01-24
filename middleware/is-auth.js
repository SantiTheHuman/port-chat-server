// require("dotenv").config();
// const jwt = require("jsonwebtoken");

// module.exports = (req, res, next) => {
//   if (req.session.userId) {
//     return res.status(200).json({
//       success: true,
//     });
//   } else {
//     return res.status(200).json({
//       success: false,
//     });
//   }
// };

// module.exports = (req, res, next) => {
//     const authHeader = req.get("Authorization");
//     if (!authHeader) {
//       const error = new Error("Not authenticated.");
//       err.statusCode = 401;
//       throw error;
//     }
//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SESSION_SECRET);
//     } catch (err) {
//       err.statusCode = 500;
//       throw err;
//     }
//     if (!decodedToken) {
//       const error = new Error("Not authenticated.");
//       err.statusCode = 401;
//       throw error;
//     }
//     req.userId = decodedToken.userId;
//     next();
// };

// module.exports = (req, res, next) => {
//   const authHeader = req.get("Authorization");
//   if (!authHeader) {
//     const error = new Error("Not authenticated.");
//     err.statusCode = 401;
//     throw error;
//   }
//   const token = authHeader.split(" ")[1];
//   let decodedToken;
//   try {
//     decodedToken = jwt.verify(token, SESSION_SECRET);
//   } catch (err) {
//     err.statusCode = 500;
//     throw err;
//   }
//   if (!decodedToken) {
//     const error = new Error("Not authenticated.");
//     err.statusCode = 401;
//     throw error;
//   }
//   req.userId = decodedToken.userId;
//   next();
// };
