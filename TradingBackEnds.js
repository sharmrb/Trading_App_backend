
const express = require('express');
const bodyParser = require('body-parser');
const Robinhood = require('robinhood');
const cors = require('cors');
const axios = require('axios');
const app = express();


app.use(bodyParser.json());
app.use(cors());


// Input robinhood creds 
const mfa_code =''
const credentials = {
    username: '',
    password: '',
};

let stockUrl = '';
let stocksymbol = '';
let biddingPrice='' ; // Setting the latest closing price as the bidding price

// fetch the stock URL
app.post('/api/fetch-stock-url',  async (req, res) => {
    const symbol = req.body.symbol;
    stocksymbol = symbol;
    try {
        console.log('Symbol:', symbol);
        const response = await axios.get(`https://api.robinhood.com/instruments/?symbol=${symbol}`);
        const data = response.data;
        //console.log(data);
        // Respond with the fetched data
        stockUrl = data.results[0].url;

        console.log('Stock URL:', stockUrl);
        res.json(data);
    } catch (error) {
        console.error('Error fetching stock URL:', error);
        res.status(500).json({ error: 'Error fetching stock URL' });
    }
});

        app.post('/api/fetch-current-price', (req, res) => {
           
            const newBiddingPrice = req.body.currentprice;
        
            
            biddingPrice = newBiddingPrice;

            console.log('Bidding price updated:', biddingPrice);
            
        
            
            res.json({ message: 'Bidding price updated successfully' });
        });

  

app.post('/run-robinhood-script', (req, res) => {
    const options = {
        type: 'limit',
        quantity: 1,
        bid_price: biddingPrice,
        instrument: {
            url: stockUrl,
            symbol: stocksymbol 
        },
        timeInForce: 'gfd',
        trigger: 'immediate',
    };
    const robinhood = Robinhood(credentials, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Robinhood authentication failed' });
        } else {
            //  check for MFA
            if (data && data.mfa_required) {
                
                

                robinhood.set_mfa_code(mfa_code, () => {
                    // Authentication successful
                    robinhood.user((error, response, body) => {
                        if (error) {
                            console.error(error);
                            res.status(500).json({ error: 'Robinhood user request failed' });
                        } else {
                            console.log('User:');
                            console.log(body);

                           //Place a buy order
                            robinhood.place_buy_order(options, (orderError, orderResponse, orderBody) => {
                                if (orderError) {
                                    console.error(orderError);
                                    res.status(500).json({ error: 'Robinhood order placement failed' });
                                } else {
                                    console.log('Buy order placed successfully:', orderBody);
                                    res.status(200).json({ message: 'Buy order placed successfully' });
                                }
                            });
                        }
                    });
                });
            } else {
                // mfa not required
                robinhood.user((error, response, body) => {
                    if (error) {
                        console.error(error);
                        res.status(500).json({ error: 'Robinhood user request failed' });
                    } else {
                        console.log('User:');
                        console.log(body);
                        res.status(200).json({ message: 'Robinhood script executed successfully' });
                    }
                });
            }
        }
    });
});

app.post('/api/sell-stock', (req, res) => {
    const options = {
        type: 'limit',
        quantity: 1,
        bid_price: biddingPrice,
        instrument: {
            url: stockUrl,
            symbol: stocksymbol 
        },
        timeInForce: 'gfd',
        trigger: 'immediate',
    };
    const robinhood = Robinhood(credentials, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Robinhood authentication failed' });
        } else {
            // Authentication successful, check for Mfa
            if (data && data.mfa_required) {
                
                

                robinhood.set_mfa_code(mfa_code, () => {
                    // Authentication successful
                    robinhood.user((error, response, body) => {
                        if (error) {
                            console.error(error);
                            res.status(500).json({ error: 'Robinhood user request failed' });
                        } else {
                            console.log('User:');
                            console.log(body);

                           //Place a sell order
                            robinhood.place_sell_order(options, (orderError, orderResponse, orderBody) => {
                                if (orderError) {
                                    console.error(orderError);
                                    res.status(500).json({ error: 'Robinhood order placement failed' });
                                } else {
                                    console.log('Buy order placed successfully:', orderBody);
                                    res.status(200).json({message: 'Sell order placed successfully' });
                                }
                            });
                        }
                    });
                });
            } else {
                
                robinhood.user((error, response, body) => {
                    if (error) {
                        console.error(error);
                        res.status(500).json({ error: 'Robinhood user request failed' });
                    } else {
                        console.log('User:');
                        console.log(body);
                        res.status(200).json({ message: 'Robinhood script executed successfully' });
                    }
                });
            }
        }
    });
});

// start the Express server
app.listen(3050, () => {
    console.log('Server is running on port 3050');
});
