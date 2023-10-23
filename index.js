const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const thingiverse_link = process.argv[2];

function ThingiverseDownloader(thingiverse_link, targetFolder){
  return new Promise((resolve, reject) => { 
    const link = String(thingiverse_link).replace(/\/(makes|files|remixes|apps)$/, "") + "/zip";
    const localPath = './tmp/thingiverse.zip';
    const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36";
    const command = `curl -L -o ${localPath} -A "${userAgent}" ${link}`;

    console.log(link);

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
      
      if (link.includes("thingiverse.com")) {
        exec(command, (error, stdout, stderr) => {
          if (error) {
              console.error(`exec error: ${error}`);
              reject(error);
              return;
          }
          console.log(`Datei wurde nach ${localPath} heruntergeladen.`);
          console.log(stderr);

          // Definieren Sie den Pfad zur ZIP-Datei und den Zielordner
          const zipFilePath = localPath;
          const stlFolder = targetFolder + '/files';

          // Erstellen Sie ein AdmZip-Objekt
          const zip = new AdmZip(zipFilePath);

          // Entpacken Sie die Datei in den Zielordner
          zip.extractAllTo(targetFolder, true);

          // Verarbeitet das Hauptverzeichnis und alle Unterverzeichnisse
          processDirectory(targetFolder);

          fs.rmdirSync(targetFolder + '/images');

          stlPaths.forEach(stlPath => {
            const destPath = path.join(stlFolder, path.basename(stlPath));
            fs.renameSync(stlPath, destPath);
          });

          console.log("fullpfad: " + stlPaths);
          console.log("destination: " + stlFolder);

          resolve({ fullpfad: stlPaths.join(", "), destination: stlFolder.replace(/\./g, '')}); // Erfolgreiches Ergebnis zurückgeben
        });
      } else {
          console.log("Der String enthält nicht 'thingiverse.com'.");
          reject(new Error("Nicht ein Thingiverse Link.")); // Fehler zurückgeben
      }
  });
}

try {
  fs.mkdir('./tmp', { recursive: true }, (error) => {
    if (error) {
        return console.error(`Fehler beim Erstellen des Verzeichnisses: ${error.message}`);
    }
    console.log(`Verzeichnis ${'./tmp'} wurde erstellt.`);
  });
  
  const result = ThingiverseDownloader(thingiverse_link, './tmp');
  console.log(result.fullpfad);
  console.log(result.destination);
} catch (error) {
  console.error("Fehler beim Herunterladen von Thingiverse:", error);
}


module.exports = ThingiverseDownloader;