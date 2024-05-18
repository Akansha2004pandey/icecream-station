const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const PaytmChecksum = require('paytmchecksum');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MID = 'YOUR_MID_HERE';
const MERCHANT_KEY = 'YOUR_MERCHANT_KEY';
const WEBSITE = 'WEBSTAGING'; // For production use 'DEFAULT'
const CALLBACK_URL = 'https://your.callback.url';

// Route to initiate a payment
app.post('/initiate', async (req, res) => {
    const orderId = uuidv4(); // Generate a unique order ID

    const paytmParams = {
        body: {
            requestType: 'Payment',
            mid: MID,
            websiteName: WEBSITE,
            orderId: orderId,
            callbackUrl: CALLBACK_URL,
            txnAmount: {
                value: req.body.amount,
                currency: 'INR',
            },
            userInfo: {
                custId: req.body.custId,
            },
        },
    };

    try {
        const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), MERCHANT_KEY);
        paytmParams.head = {
            signature: checksum,
        };

        const post_data = JSON.stringify(paytmParams);

        const options = {
            hostname: 'securegw-stage.paytm.in', // For production use 'securegw.paytm.in'
            port: 443,
            path: `/theia/api/v1/initiateTransaction?mid=${MID}&orderId=${orderId}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length,
            },
        };

        const response = await new Promise((resolve, reject) => {
            let response = '';
            const post_req = https.request(options, (post_res) => {
                post_res.on('data', (chunk) => {
                    response += chunk;
                });

                post_res.on('end', () => {
                    resolve(JSON.parse(response));
                });
            });

            post_req.on('error', (error) => {
                reject(error);
            });

            post_req.write(post_data);
            post_req.end();
        });

        res.json({
            orderId: orderId,
            txnToken: response.body.txnToken,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to handle Paytm callback
app.post('/callback', (req, res) => {
    const paytmChecksum = req.body.CHECKSUMHASH;
    const isVerifySignature = PaytmChecksum.verifySignature(req.body, MERCHANT_KEY, paytmChecksum);

    if (isVerifySignature) {
        const paytmParams = {
            body: {
                mid: MID,
                orderId: req.body.ORDERID,
            },
        };

        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), MERCHANT_KEY).then((checksum) => {
            paytmParams.head = {
                signature: checksum,
            };

            const post_data = JSON.stringify(paytmParams);

            const options = {
                hostname: 'securegw-stage.paytm.in', // For production use 'securegw.paytm.in'
                port: 443,
                path: '/v3/order/status',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length,
                },
            };

            let response = '';
            const post_req = https.request(options, (post_res) => {
                post_res.on('data', (chunk) => {
                    response += chunk;
                });

                post_res.on('end', () => {
                    const result = JSON.parse(response);
                    res.json(result);
                });
            });

            post_req.write(post_data);
            post_req.end();
        });
    } else {
        res.status(400).json({ error: 'Checksum Mismatched' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
