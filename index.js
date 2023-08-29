const dns = require('dns');
const express = require('express');
const app = express();

async function resolveAllDnsQueries(hostname) {
    try {
        const [ipv4, ipv6, mx, nameserver] = await Promise.all([
            dns.promises.resolve4(hostname).catch(() => []),
            dns.promises.resolve6(hostname).catch(() => []),
            dns.promises.resolveMx(hostname).catch(() => []),
            dns.promises.resolveNs(hostname).catch(() => [])
        ]);

        const rdnsPromises = ipv4.map(ip => dns.promises.reverse(ip));

        const rdnsResults = await Promise.all(rdnsPromises);

        const rdns = {};
        for (let i = 0; i < ipv4.length; i++) {
            rdns[ipv4[i]] = rdnsResults[i];
        }

        return { ipv4, ipv6, mx, nameserver, rdns };
    } catch (error) {
        throw error;
    }
}

app.get('/lookup/:domain', async (req, res) => {
    try {
        const domain = req.params.domain;

        const domainInfo = await resolveAllDnsQueries(domain);
        res.json(domainInfo);
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error: 'invalid domain'
        });
    }
});

app.listen(5544, () => {

    console.log('DNS Lookup Service');
});