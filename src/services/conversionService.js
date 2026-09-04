import Papa from 'papaparse';
import * as XLSX from 'xlsx';
// import heic2any from 'heic2any';
// const heic2any = (await import("heic2any")).default;

// ===== IMAGE CONVERSIONS =====
export const convertImage = async (file, targetFormat) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let imageData = e.target.result;

        // Handle HEIC conversion
        if (file.name.toLowerCase().endsWith('.heic') && targetFormat.toLowerCase() !== 'heic') {
          const { default: heic2any } = await import("heic2any");
          const blob = await heic2any({ blob: file, toType: 'image/jpeg' });
          const reader2 = new FileReader();
          reader2.onload = (e2) => {
            imageData = e2.target.result;
            processImageConversion(imageData, file.name, targetFormat, resolve, reject);
          };
          reader2.readAsDataURL(blob);
        } else {
          processImageConversion(imageData, file.name, targetFormat, resolve, reject);
        }
      } catch (error) {
        reject(new Error(`Image conversion failed: ${error.message}`));
      }
    };
    reader.readAsDataURL(file);
  });
};

const processImageConversion = (imageData, fileName, targetFormat, resolve, reject) => {
  const img = new Image();
  img.src = imageData;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const mimeType = {
      'PNG': 'image/png',
      'JPG': 'image/jpeg',
      'JPEG': 'image/jpeg',
      'WebP': 'image/webp',
      'GIF': 'image/gif',
      'HEIC': 'image/heic',
    };

    canvas.toBlob(
      (blob) => {
        // Get original filename without extension
        const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
        const newFileName = `${nameWithoutExt}.${targetFormat.toLowerCase()}`;
        
        const file = new File([blob], newFileName, { type: mimeType[targetFormat] });
        resolve(file);
      },
      mimeType[targetFormat] || 'image/jpeg',
      0.95
    );
  };
  img.onerror = () => {
    reject(new Error('Failed to load image'));
  };
};

// ===== DATA CONVERSIONS =====
export const convertData = async (file, targetFormat) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');

  if (fileExtension === 'csv') {
    if (targetFormat === 'JSON') return convertCsvToJson(file, nameWithoutExt);
    if (targetFormat === 'Excel (.xlsx)') return convertCsvToExcel(file, nameWithoutExt);
    if (targetFormat === 'XML') return convertCsvToXml(file, nameWithoutExt);
    if (targetFormat === 'TXT') return convertCsvToTxt(file, nameWithoutExt);
  }
  if (fileExtension === 'json') {
    if (targetFormat === 'CSV') return convertJsonToCsv(file, nameWithoutExt);
    if (targetFormat === 'Excel (.xlsx)') return convertJsonToExcel(file, nameWithoutExt);
    if (targetFormat === 'XML') return convertJsonToXml(file, nameWithoutExt);
    if (targetFormat === 'TXT') return convertJsonToTxt(file, nameWithoutExt);
  }
  if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    if (targetFormat === 'CSV') return convertExcelToCsv(file, nameWithoutExt);
    if (targetFormat === 'JSON') return convertExcelToJson(file, nameWithoutExt);
    if (targetFormat === 'XML') return convertExcelToXml(file, nameWithoutExt);
  }
  if (fileExtension === 'xml') {
    if (targetFormat === 'JSON') return convertXmlToJson(file, nameWithoutExt);
    if (targetFormat === 'CSV') return convertXmlToCsv(file, nameWithoutExt);
    if (targetFormat === 'Excel (.xlsx)') return convertXmlToExcel(file, nameWithoutExt);
  }
  if (fileExtension === 'txt') {
    if (targetFormat === 'JSON') return convertTxtToJson(file, nameWithoutExt);
    if (targetFormat === 'CSV') return convertTxtToCsv(file, nameWithoutExt);
    if (targetFormat === 'XML') return convertTxtToXml(file, nameWithoutExt);
  }

  throw new Error('Conversion not supported');
};

// CSV Conversions
const convertCsvToJson = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const jsonData = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const newFile = new File([blob], `${nameWithoutExt}.json`, { type: 'application/json' });
        resolve(newFile);
      },
      error: (error) => {
        reject(new Error(`CSV Parse Error: ${error.message}`));
      },
    });
  });
};

const convertCsvToExcel = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const ws = XLSX.utils.json_to_sheet(result.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        
        // Create blob from workbook
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const newFile = new File([blob], `${nameWithoutExt}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        resolve(newFile);
      },
      error: (error) => {
        reject(new Error(`CSV Parse Error: ${error.message}`));
      },
    });
  });
};

const convertCsvToXml = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        let xmlData = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
        result.data.forEach((row) => {
          xmlData += '  <row>\n';
          Object.entries(row).forEach(([key, value]) => {
            xmlData += `    <${key}>${escapeXml(value)}</${key}>\n`;
          });
          xmlData += '  </row>\n';
        });
        xmlData += '</root>';
        const blob = new Blob([xmlData], { type: 'application/xml' });
        const newFile = new File([blob], `${nameWithoutExt}.xml`, { type: 'application/xml' });
        resolve(newFile);
      },
      error: (error) => {
        reject(new Error(`CSV Parse Error: ${error.message}`));
      },
    });
  });
};

const convertCsvToTxt = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const blob = new Blob([e.target.result], { type: 'text/plain' });
      const newFile = new File([blob], `${nameWithoutExt}.txt`, { type: 'text/plain' });
      resolve(newFile);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
};

// JSON Conversions
const convertJsonToCsv = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const csv = Papa.unparse(jsonData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const newFile = new File([blob], `${nameWithoutExt}.csv`, { type: 'text/csv' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`JSON Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const convertJsonToExcel = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const ws = XLSX.utils.json_to_sheet(jsonData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const newFile = new File([blob], `${nameWithoutExt}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`JSON Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const convertJsonToXml = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        let xmlData = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
        Object.entries(jsonData).forEach(([key, value]) => {
          xmlData += `  <${key}>${escapeXml(JSON.stringify(value))}</${key}>\n`;
        });
        xmlData += '</root>';
        const blob = new Blob([xmlData], { type: 'application/xml' });
        const newFile = new File([blob], `${nameWithoutExt}.xml`, { type: 'application/xml' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`JSON Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const convertJsonToTxt = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const txtData = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([txtData], { type: 'text/plain' });
        const newFile = new File([blob], `${nameWithoutExt}.txt`, { type: 'text/plain' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`JSON Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Excel Conversions
const convertExcelToCsv = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        const blob = new Blob([csv], { type: 'text/csv' });
        const newFile = new File([blob], `${nameWithoutExt}.csv`, { type: 'text/csv' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`Excel Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

const convertExcelToJson = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const jsonStr = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const newFile = new File([blob], `${nameWithoutExt}.json`, { type: 'application/json' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`Excel Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

const convertExcelToXml = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        let xmlData = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
        jsonData.forEach((row) => {
          xmlData += '  <row>\n';
          Object.entries(row).forEach(([key, value]) => {
            xmlData += `    <${key}>${escapeXml(value)}</${key}>\n`;
          });
          xmlData += '  </row>\n';
        });
        xmlData += '</root>';
        const blob = new Blob([xmlData], { type: 'application/xml' });
        const newFile = new File([blob], `${nameWithoutExt}.xml`, { type: 'application/xml' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`Excel Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// XML Conversions
const convertXmlToJson = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
        const jsonData = xmlToJson(xmlDoc);
        const jsonStr = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const newFile = new File([blob], `${nameWithoutExt}.json`, { type: 'application/json' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`XML Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const convertXmlToCsv = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
        const rows = xmlDoc.getElementsByTagName('row');
        const csv = xmlToCsv(rows);
        const blob = new Blob([csv], { type: 'text/csv' });
        const newFile = new File([blob], `${nameWithoutExt}.csv`, { type: 'text/csv' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`XML Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const convertXmlToExcel = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
        const rows = xmlDoc.getElementsByTagName('row');
        const data = [];
        Array.from(rows).forEach((row) => {
          const rowData = {};
          Array.from(row.children).forEach((child) => {
            rowData[child.tagName] = child.textContent;
          });
          data.push(rowData);
        });
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const newFile = new File([blob], `${nameWithoutExt}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        resolve(newFile);
      } catch (error) {
        reject(new Error(`XML Parse Error: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Text Conversions
const convertTxtToJson = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter((line) => line.trim());
      const jsonData = { lines };
      const jsonStr = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const newFile = new File([blob], `${nameWithoutExt}.json`, { type: 'application/json' });
      resolve(newFile);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const convertTxtToCsv = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter((line) => line.trim());
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const newFile = new File([blob], `${nameWithoutExt}.csv`, { type: 'text/csv' });
      resolve(newFile);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const convertTxtToXml = (file, nameWithoutExt) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter((line) => line.trim());
      let xmlData = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
      lines.forEach((line, index) => {
        xmlData += `  <line index="${index}">${escapeXml(line)}</line>\n`;
      });
      xmlData += '</root>';
      const blob = new Blob([xmlData], { type: 'application/xml' });
      const newFile = new File([blob], `${nameWithoutExt}.xml`, { type: 'application/xml' });
      resolve(newFile);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// ===== UTILITY FUNCTIONS =====
const escapeXml = (unsafe) => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const xmlToJson = (xml) => {
  let obj = {};
  if (xml.nodeType === 1) {
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let j = 0; j < xml.attributes.length; j += 1) {
        const attribute = xml.attributes.item(j);
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) {
    obj = xml.nodeValue;
  }

  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i += 1) {
      const item = xml.childNodes.item(i);
      const nodeName = item.nodeName;
      if (typeof obj[nodeName] === 'undefined') {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof obj[nodeName].push === 'undefined') {
          obj[nodeName] = [obj[nodeName]];
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
};

const xmlToCsv = (rows) => {
  if (rows.length === 0) return '';

  const headers = [];
  for (let i = 0; i < rows[0].children.length; i += 1) {
    headers.push(rows[0].children[i].tagName);
  }

  let csv = headers.join(',') + '\n';
  for (let i = 0; i < rows.length; i += 1) {
    const values = [];
    for (let j = 0; j < rows[i].children.length; j += 1) {
      values.push(`"${rows[i].children[j].textContent}"`);
    }
    csv += values.join(',') + '\n';
  }
  return csv;
};
