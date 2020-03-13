import multer from 'multer';
import crypto from 'crypto';
import { extname, resolve } from 'path';

// resolve: descreve um caminho na pasta
// multer: responsavel por guardar arquivos em alguma pasta, podendo ou n ser online

export default {
  storage: multer.diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, res) => {
        if (err) return cb(err);
        // extname bota o '.png' no final do arquivo
        return cb(null, res.toString('hex') + extname(file.originalname));
      });
    },
  }),
};
