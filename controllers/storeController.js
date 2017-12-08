const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.myMiddleware = (req, res, next) => {
	req.name = "Wes";
	next();
}

exports.homePage = (req, res) => {
	console.log(req.name);
	res.render('index');
}

exports.addStore = (req, res) => {
	res.render('editStore', { title: 'Add Store' });
}

exports.createStore = async (req, res) => {
	const store = await (new Store(req.body)).save();
	req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
	res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	// Query the database for a list of stores
	const stores = await Store.find();
	console.log(stores);
	res.render('stores', {title: 'Stores', stores: stores});
}

exports.editStore = async (req, res) => {
	//res.json(req.params);
	const store = await Store.findOne({_id: req.params.id});
	res.render('editStore', {title: `Edit ${store.name}`,store: store});
}

exports.updateStore = async (req, res) => {
	const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body,{
		new : true,
		runValidators: true

	}).exec();
	req.flash('success', `Successfully updated <strong>${store.name}</strong><a href="/stores/${store.slug}"> View Store &rarr;</a>`);
	res.redirect(`/stores/${store._id}/edit`);
};