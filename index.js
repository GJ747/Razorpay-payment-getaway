const express = require("express");
const app = express();
var bodyParser = require('body-parser');
const path = require('path');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const PaymentDetail = require('./model/payment-detail')

app.set('views',path.join(__dirname,'/views'));
app.set('view engine', 'ejs');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/payment');
  console.log('database start')
}

var razorPayInstance = new Razorpay({  
    key_id: 'Use your own key',  
    key_secret: 'Use your own key'
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); 

app.get('/',(req,res)=>{
    res.render('payment.ejs')
})

app.post('/payment', function(req, res, next) {
	params = {
		amount: req.body.amount * 100,
		currency: "INR",
		receipt: '1243',
		payment_capture: "1"
	}
	razorPayInstance.orders.create(params)
	.then(async (response) => {
		const razorpayKeyId = 'Use your own key'
		// Save orderId and other payment details
		const paymentDetail = new PaymentDetail({
			orderId: response.id,
			receiptId: response.receipt,
			amount: response.amount,
			currency: response.currency,
			createdAt: response.created_at,
			status: response.status
		})
		try {
			// Render Order Confirmation page if saved succesfully
			await paymentDetail.save()
			res.render('checkout.ejs', {
				title: "Confirm Order",
				razorpayKeyId: 'Use your own key',
				paymentDetail : paymentDetail
			})
		} catch (err) {
			// Throw err if failed to save
			if (err) throw err;
		}
	}).catch((err) => {
		// Throw err if failed to create order
		if (err) throw err;
	})
});

app.post('/verify', async function(req, res, next) {
	body=req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
	let crypto = require("crypto");
	let expectedSignature = crypto.createHmac('sha256', 'Use your own secret key')
							.update(body.toString())
							.digest('hex');

	// Compare the signatures
	if(expectedSignature === req.body.razorpay_signature) {
	
				res.render('success.ejs', {
					title: "Payment verification successful",
					// paymentDetail
				})

        console.log(req.body.razorpay_payment_id,req.body.razorpay_signature,)
	} else {
		res.render('fail.ejs', {
			title: "Payment verification failed",
		})
	}
});

app.listen(3000,()=>{
    console.log('server start')
})