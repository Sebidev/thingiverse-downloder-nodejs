const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const url = process.argv.slice(2) + '/zip';
const localPath = './thingiverse.zip';
const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36";
const command = `curl -L -o ${localPath} -A "${userAgent}" ${url}`;

const stlPaths = [];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const fileStat = fs.statSync(filePath);
  
      if (fileStat.isDirectory()) {
        processDirectory(filePath); // Rekursiver Aufruf für Unterverzeichnisse
      } else {
        if (path.extname(file).toLowerCase() !== '.stl') {
          fs.unlinkSync(filePath); // Datei löschen
        } else {
          stlPaths.push(filePath); // Pfad der STL-Datei speichern
        }
      }
    });
}

if (url.includes("thingiverse.com")) {
    exec(command, (error, stdout, stderr) => {
      if (error) {
          console.error(`exec error: ${error}`);
          return;
      }
      console.log(`Datei wurde nach ${localPath} heruntergeladen.`);
      console.log(stderr);

      // Definieren Sie den Pfad zur ZIP-Datei und den Zielordner
      const zipFilePath = localPath;
      const targetFolder = './tmp';
      const stlFolder = './tmp/files'

      // Erstellen Sie ein AdmZip-Objekt
      const zip = new AdmZip(zipFilePath);

      // Entpacken Sie die Datei in den Zielordner
      zip.extractAllTo(targetFolder, true);

      // Verarbeitet das Hauptverzeichnis und alle Unterverzeichnisse
      processDirectory(targetFolder);

      fs.rmdirSync(targetFolder + '/images');

      // ZIP-Datei löschen
      fs.unlinkSync(zipFilePath);

      // STL-Dateien in einen eigenen Ordner verschieben
      if (!fs.existsSync(stlFolder)) {
      fs.mkdirSync(stlFolder);
      }

      stlPaths.forEach(stlPath => {
      const destPath = path.join(stlFolder, path.basename(stlPath));
      fs.renameSync(stlPath, destPath);
      });

      console.log(stlPaths);
  });
} else {
    console.log("Der String enthält nicht 'thingiverse.com'.");
    return;
}