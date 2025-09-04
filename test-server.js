const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (parsedUrl.pathname === '/device-faults/summary') {
        // Generate test data
        const data = [
            {
                atm_and_address: "ATM001 - 123 Main St, City Center",
                total_faults: 45,
                faults_summary: "Network: 20, Hardware: 15, Software: 10"
            },
            {
                atm_and_address: "ATM002 - 456 Oak Ave, Downtown",
                total_faults: 32,
                faults_summary: "Hardware: 18, Network: 10, Software: 4"
            },
            {
                atm_and_address: "ATM003 - 789 Pine Rd, North Mall",
                total_faults: 28,
                faults_summary: "Software: 15, Network: 8, Hardware: 5"
            },
            {
                atm_and_address: "ATM004 - 321 Elm St, East Side",
                total_faults: 25,
                faults_summary: "Network: 12, Hardware: 8, Software: 5"
            },
            {
                atm_and_address: "ATM005 - 654 Maple Dr, West Plaza",
                total_faults: 22,
                faults_summary: "Hardware: 10, Software: 7, Network: 5"
            }
        ];
        
        // Handle server-side pagination
        const page = parseInt(parsedUrl.query.page) || 1;
        const limit = parseInt(parsedUrl.query.limit) || 10;
        const search = parsedUrl.query.search || '';
        
        // Filter by search
        let filteredData = data;
        if (search) {
            filteredData = data.filter(item => 
                Object.values(item).some(val => 
                    val.toString().toLowerCase().includes(search.toLowerCase())
                )
            );
        }
        
        // Paginate
        const start = (page - 1) * limit;
        const paginatedData = filteredData.slice(start, start + limit);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            data: paginatedData,
            total: filteredData.length
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/device-faults/summary`);
});