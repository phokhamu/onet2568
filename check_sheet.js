
import fetch from 'node-fetch';
import XLSX from 'xlsx';

const url = 'https://docs.google.com/spreadsheets/d/1cu-0G2xAmXqCTfenXbge0QTGJKJbp7Ne6hGkIk7puNE/export?format=xlsx';

async function checkSheet() {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        console.log('Sheet Names:', workbook.SheetNames);
        workbook.SheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            console.log(`Sheet: ${name}, Rows: ${data.length}`);
            console.log('First 10 rows:', JSON.stringify(data.slice(0, 10), null, 2));
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSheet();
