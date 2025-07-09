import { server } from "./app.js";
import { connectDB } from "./db/db.js";



connectDB()
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT} in ${process.env.NODE_ENV} Mode`);
    });
  })
  .catch((error) => console.log("MONGO db connection failed!!! " + error));
