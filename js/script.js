document.addEventListener('DOMContentLoaded', () => {
    const cidrForm = document.getElementById('cidrForm');
    const subnetForm = document.getElementById('subnetForm');
    const ipLookupForm = document.getElementById('ipLookupForm');
    const processBulkInput = document.getElementById('processBulkInput');
    const bulkInputFile = document.getElementById('bulkInputFile');
    const resultContainer = document.getElementById('resultContainer');
    const subnetResultContainer = document.getElementById('subnetResultContainer');
    const lookupResultContainer = document.getElementById('lookupResultContainer');
    const ipAddressInput = document.getElementById('ipAddress');
    const cidrInput = document.getElementById('cidr');

    // Recalculate on input change
    ipAddressInput.addEventListener('input', calculateCIDR);
    cidrInput.addEventListener('input', calculateCIDR);

    // Form submissions
    cidrForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateCIDR();
    });

    subnetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        splitSubnet();
    });

    ipLookupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        lookupIPAddress();
    });

    processBulkInput.addEventListener('click', (e) => {
        processBulkFile();
    });

    function calculateCIDR() {
        const ipAddress = ipAddressInput.value;
        const cidr = parseInt(cidrInput.value);

        if (!ipAddress || isNaN(cidr) || cidr < 0 || cidr > 32) {
            resultContainer.style.display = 'none';
            return;
        }

        try {
            const [networkAddress, broadcastAddress, totalHosts, usableHosts, subnetMask, wildcardMask, firstUsableIP, lastUsableIP] = calculateCIDRRange(ipAddress, cidr);

            document.getElementById('networkAddress').innerText = networkAddress;
            document.getElementById('broadcastAddress').innerText = broadcastAddress;
            document.getElementById('totalHosts').innerText = totalHosts;
            document.getElementById('usableHosts').innerText = usableHosts;
            document.getElementById('subnetMask').innerText = subnetMask;
            document.getElementById('wildcardMask').innerText = wildcardMask;
            document.getElementById('firstUsableIP').innerText = firstUsableIP;
            document.getElementById('lastUsableIP').innerText = lastUsableIP;
            resultContainer.style.display = 'block';
        } catch (error) {
            console.error('Error calculating CIDR:', error);
            resultContainer.style.display = 'none';
        }
    }

    function calculateCIDRRange(ip, cidr) {
        function ipToBinary(ip) {
            return ip.split('.').map(octet => 
                ('00000000' + parseInt(octet, 10).toString(2)).slice(-8)
            ).join('');
        }

        function binaryToIp(binary) {
            return binary.match(/.{8}/g).map(bin => parseInt(bin, 2)).join('.');
        }

        function getSubnetMask(cidr) {
            const mask = Array(32).fill('0');
            for (let i = 0; i < cidr; i++) {
                mask[i] = '1';
            }
            return binaryToIp(mask.join(''));
        }

        function getWildcardMask(subnetMask) {
            return subnetMask.split('.').map(octet => 
                (255 - parseInt(octet, 10)).toString()
            ).join('.');
        }

        const ipBinary = ipToBinary(ip);
        const subnetMaskBinary = getSubnetMask(cidr).split('.').map(octet => 
            ('00000000' + parseInt(octet, 10).toString(2)).slice(-8)
        ).join('');
        const networkBinary = ipBinary.substring(0, cidr) + '0'.repeat(32 - cidr);
        const broadcastBinary = ipBinary.substring(0, cidr) + '1'.repeat(32 - cidr);

        const networkAddress = binaryToIp(networkBinary);
        const broadcastAddress = binaryToIp(broadcastBinary);
        const totalHosts = Math.pow(2, 32 - cidr);
        const usableHosts = totalHosts - 2;
        const subnetMask = getSubnetMask(cidr);
        const wildcardMask = getWildcardMask(subnetMask);
        const firstUsableIP = binaryToIp(networkBinary.replace(/0{8}$/, '00000001'));
        const lastUsableIP = binaryToIp(broadcastBinary.replace(/1{8}$/, '11111110'));

        return [networkAddress, broadcastAddress, totalHosts, usableHosts, subnetMask, wildcardMask, firstUsableIP, lastUsableIP];
    }

    function splitSubnet() {
        const originalCidr = document.getElementById('originalCidr').value;
        const newCidr = parseInt(document.getElementById('newCidr').value);
        const subnetResults = document.getElementById('subnetResults');
        subnetResults.innerHTML = "";

        if (!originalCidr || isNaN(newCidr) || newCidr <= parseInt(originalCidr.split('/')[1])) {
            subnetResultContainer.style.display = 'none';
            return;
        }

        // Mock splitting logic (replace with actual subnet splitting logic)
        for (let i = 0; i < 4; i++) {
            const li = document.createElement('li');
            li.className = "list-group-item";
            li.innerText = `192.168.${i}.0/${newCidr}`;
            subnetResults.appendChild(li);
        }
        subnetResultContainer.style.display = 'block';
    }

    function lookupIPAddress() {
        const lookupIp = document.getElementById('lookupIp').value;
        const lookupResults = document.getElementById('lookupResults');
        lookupResults.innerHTML = "";

        if (!lookupIp) {
            lookupResultContainer.style.display = 'none';
            return;
        }

        // Replace with your actual ipinfo API key
        const apiKey = '290e7cc67ea513';
        const apiUrl = `https://ipinfo.io/${lookupIp}/json?token=${apiKey}`;

        // Make the API request
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    lookupResults.innerHTML = `<li class="list-group-item">Error: ${data.error.message}</li>`;
                } else {
                    const result = {
                        "IP": data.ip || "N/A",
                        "Hostname": data.hostname || "N/A",
                        "ASN": data.asn ? data.asn.asn : "N/A",
                        "ISP": data.org || "N/A",
                        "Country": data.country || "N/A",
                        "State/Region": data.region || "N/A",
                        "City": data.city || "N/A",
                        "Latitude": data.loc ? `${data.loc.split(',')[0]} (Latitude)` : "N/A",
                        "Longitude": data.loc ? `${data.loc.split(',')[1]} (Longitude)` : "N/A"
                    };

                    // Display the results
                    for (let key in result) {
                        const li = document.createElement('li');
                        li.className = "list-group-item";
                        li.innerText = `${key}: ${result[key]}`;
                        lookupResults.appendChild(li);
                    }
                }
                lookupResultContainer.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching IP data:', error);
                lookupResults.innerHTML = '<li class="list-group-item">Failed to retrieve data</li>';
                lookupResultContainer.style.display = 'block';
            });
    }

    function processBulkFile() {
        const file = bulkInputFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const csvContent = e.target.result;
                const ipList = csvContent.split(/\r?\n/);
                // For demo, just showing the first 5 IPs
                console.log("First 5 IPs:", ipList.slice(0, 5));
                alert('CSV processed! (Check console for details)');
            };
            reader.readAsText(file);
        } else {
            alert('Please upload a file!');
        }
    }
});
