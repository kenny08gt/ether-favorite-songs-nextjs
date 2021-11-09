import { getPreview } from "spotify-url-info";

export default function handler(req, res) {
  const { url } = req.query;
  console.log(url);
  getPreview(url).then((preview) => {
    res.status(200).json(preview);
  });
  // res.status(200).json({ name: 'John Doe' })
}
