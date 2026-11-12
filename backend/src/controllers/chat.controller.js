import { genrateStreamToken } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const token = await genrateStreamToken(userId);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in generating Stream token", error.message);
    res.status(500).json({ message: "Internal Server Error in stream token" });
  }
}