
import fetch from 'node-fetch';
import XLSX from 'xlsx';

const url = 'https://docs.google.com/spreadsheets/d/1hKGYH1uB-S9XFSB_Y50-Eksyf57Du0XBJP7iEhoxkkw/export?format=xlsx';

async function checkSheet() {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        console.log('Sheet Names:', workbook.SheetNames);
        workbook.SheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet);
            console.log(`Sheet: ${name}, Rows: ${data.length}`);
            if (name.includes('วิเคราะห์ผล')) {
                console.log('Data:', JSON.stringify(data, null, 2));
            }
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSheet();
