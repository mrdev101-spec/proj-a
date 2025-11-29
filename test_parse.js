
const fs = require('fs');

const csvText = `No,Service Center,HCode,Location,PC-ID,AnyDesk ID,Map
1,โรงพยาบาลส่งเสริมสุขภาพตำบลนิคมสร้างตนเอง,09146,เมืองสุราษฎร์ธานี,SNI-POH0008,1960014664,
2,สถานีอนามัยเฉลิมพระเกียรติ ๖o พรรษา นวมินทราชินี บ้านควนยูง,09147,เมืองสุราษฎร์ธานี,SNI-POH0018,1913375214,
3,โรงพยาบาลส่งเสริมสุขภาพตำบลบางชนะ,09149,เมืองสุราษฎร์ธานี,SNI-POH0005,1638619109,
`;

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    // Assuming first row is header, so start from index 1
    // Column order: ID, Name, HCode, District, PC-ID, AnyDesk

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split (doesn't handle commas inside quotes)
        // For robust parsing, consider a library or regex
        const columns = line.split(',');

        if (columns.length >= 6) {
            result.push({
                name: columns[1].trim(),
                hcode: columns[2].trim(),
                district: columns[3].trim(),
                pcId: columns[4].trim(),
                anydesk: columns[5].trim()
            });
        } else {
            console.log('Skipping line (cols=' + columns.length + '):', line);
        }
    }
    return result;
}

const parsed = parseCSV(csvText);
console.log('Parsed items:', parsed.length);
console.log(parsed);
