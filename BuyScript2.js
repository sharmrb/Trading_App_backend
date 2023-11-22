const express = require('express');
const bodyParser = require('body-parser');
const Robinhood = require('robinhood');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());
app.use(cors());

// const mfa_code = '';
// const credentials = {
//     username: '',
//     password: '',
// };

let robinhoodInstance = null;
let stockUrl = '';
let stocksymbol = '';
let biddingPrice='' ;

app.post('/api/login', (req, res) => {
    const { username, password, mfaCode } = req.body;
  
    // Set the credentials based on user input
    const credentials = {
      username,
      password,
    };
  
    // Initialize Robinhood instance
    robinhoodInstance = Robinhood(credentials, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Login failed' });
      } else {
        if (data && data.mfa_required) {
          console.log('MFA token required');
          // Handle MFA if required
          console.log(mfaCode);
          robinhoodInstance.set_mfa_code(mfaCode, () => {
            console.log(robinhoodInstance.auth_token());
          });
        }
        return res.status(200).json({ success: true, message: 'Login successful' });
      }
    });
  });


// robinhoodInstance = Robinhood(credentials, (err, data) => {
//     if (err) {
//         console.error(err);
//     } else {
//         if (data && data.mfa_required) {
//             console.log('MFA token required');
//             // Handle MFA if required
//             console.log(mfa_code);
//             robinhoodInstance.set_mfa_code(mfa_code, () => {
//                 console.log(robinhoodInstance.auth_token());
//             });
         
//         }
//     }
// });


//Fetch Stock URL
app.post('/api/fetch-stock-url',  async (req, res) => {
    const symbol = req.body.symbol;
    stocksymbol = symbol;
    try {
        console.log('Symbol:', symbol);
        const response = await axios.get(`https://api.robinhood.com/instruments/?symbol=${symbol}`);
        const data = response.data;
        console.log(data);
        // Respond with the fetched data
        stockUrl = data.results[0].url;

        console.log('Stock URL:', stockUrl);
        res.json(data);
    } catch (error) {
        console.error('Error fetching stock URL:', error);
        res.status(500).json({ error: 'Error fetching stock URL' });
    }
});

//Fetch Current Price
app.post('/api/fetch-current-price', (req, res) => {
           
    const newBiddingPrice = req.body.currentprice;

    
    biddingPrice = newBiddingPrice;

    console.log('Bidding price updated:', biddingPrice);
    

    
    res.json({ message: 'Bidding price updated successfully' });
});

//Buy Function 
app.post('/run-robinhood-script', async (req, res) => {
    try {
        // Check if the robinhoodInstance is authenticated
        if (!robinhoodInstance) {
            res.status(500).json({ error: 'Not authenticated. Please authenticate first.' });
            return;
        }

        // Fetch the latest stock data (you might want to do this before executing a trade)
        // const symbol = req.body.symbol;
        // const stockDataResponse = await axios.get(`https://api.robinhood.com/instruments/?symbol=${symbol}`);
        // const stockData = stockDataResponse.data;
        // const stockUrl = stockData.results[0].url;

        // Set the options for the buy or sell order
        const options = {
            type: 'limit',
            quantity: 1,
            bid_price: biddingPrice,
            instrument: {
                url: stockUrl,
                symbol: stocksymbol,
            },
            timeInForce: 'gfd',
            trigger: 'immediate',
        };

        // Perform the buy or sell order using the robinhoodInstance
        robinhoodInstance.place_buy_order(options, (orderError, orderResponse, orderBody) => {
            if (orderError) {
                console.error(orderError);
                res.status(500).json({ error: 'Robinhood order placement failed' });
            } else {
                console.log('Buy order placed successfully:', orderBody);
                res.status(200).json({ message: 'Buy order placed successfully' });
            }
        });

        

    } catch (error) {
        console.error('Error in Robinhood script:', error);
        res.status(500).json({ error: 'Error in Robinhood script' });
    }
});



// Sell Function 
app.post('/api/sell-stock', async (req, res) => {
    try {
        // Check if the robinhoodInstance is authenticated
        if (!robinhoodInstance) {
            res.status(500).json({ error: 'Not authenticated. Please authenticate first.' });
            return;
        }
        // Setting the selling price as 1% less than bidding price
        const sellingPrice =(biddingPrice*0.99).toFixed(2);
        
        // Set the options for the buy or sell order
        const options = {
            type: 'limit',
            quantity: 1,
            bid_price: sellingPrice,
            instrument: {
                url: stockUrl,
                symbol: stocksymbol,
            },
            timeInForce: 'gfd',
            trigger: 'immediate',
        };

        // Perform the buy or sell order using the robinhoodInstance
        robinhoodInstance.place_sell_order(options, (orderError, orderResponse, orderBody) => {
            if (orderError) {
                console.error(orderError);
                res.status(500).json({ error: 'Robinhood order placement failed' });
            } else {
                console.log('Sell order placed successfully:', orderBody);
                res.status(200).json({ message: 'Buy order placed successfully' });
            }
        });

        

    } catch (error) {
        console.error('Error in Robinhood script:', error);
        res.status(500).json({ error: 'Error in Robinhood script' });
    }
});

//Logout Function
app.post('/api/logout', (req, res) => {
    try {
        if (!robinhoodInstance) {
            res.status(500).json({ error: 'Not authenticated. Please authenticate first.' });
            return;
        }
        
        robinhoodInstance.expire_token((error, response, body) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Token expiration failed' });
            } else {
                console.log('Token expired successfully:', body);
                res.status(200).json({ message: 'Token expired successfully' });
            }
        });
    } catch (error) {
        console.error('Error in Robinhood script:', error);
        res.status(500).json({ error: 'Error in Robinhood script' });
    }
});



app.listen(3050, () => {
    console.log('Server is running on port 3050');
});

