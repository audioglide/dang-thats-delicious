const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multeroptions = {
	storage: multer.memoryStorage(),
	fileFilter(req, file, next){
		const isPhoto = file.mimetype.startsWith('image/');
		if(isPhoto){
			next(null, true);
		}else{
			next({message: 'That file type isn\'t allowed'}, false);
		}
	}
}
exports.myMiddleware = (req, res, next) => {
	req.name = "Wes";
	next();
}

exports.homePage = (req, res) => {
	//console.log(req.name);
	res.render('index');
}

exports.addStore = (req, res) => {
	res.render('editStore', { title: 'Add Store' });
}

exports.upload = multer(multeroptions).single('photo');
exports.resize = async (req, res, next) => {
	if(!req.file){
		next();
		return;
	};
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	next();
}

exports.createStore = async (req, res) => {
	req.body.author = req.user._id;
	const store = await (new Store(req.body)).save();
	req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
	res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	// Query the database for a list of stores
	const stores = await Store.find();
	res.render('stores', {title: 'Stores', stores: stores});
}

const confirmOwner = (store, user) => {
	if(!store.author.equals(user._id)){
		throw Error ('You must own a store in order to edit it!');
	}
};

exports.editStore = async (req, res) => {
	//res.json(req.params);
	// 1. Find the store given the ID
	const store = await Store.findOne({_id: req.params.id});
	// 2. Confirm they are the owner of the store
	confirmOwner(store, req.user);
	// 3. Render the edit form so the user can update their store
	res.render('editStore', {title: `Edit ${store.name}`,store: store});
}

exports.updateStore = async (req, res) => {
	req.body.location.type = 'Point';
	const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body,{
		new : true,
		runValidators: true

	}).exec();
	req.flash('success', `Successfully updated <strong>${store.name}</strong><a href="/stores/${store.slug}"> View Store &rarr;</a>`);
	res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) =>{
	const store = await Store.findOne({slug: req.params.slug}).populate('author');
	if(!store) return next();
	res.render('store', {store, title:store.name});
}

exports.getStoresByTag  = async (req, res) => {
	const tag = req.params.tag;
	const tagQuery = tag || {$exists: true}
	const tagsPromise = Store.getTagsList();
	const storesPromise = Store.find({tags: tagQuery});
	const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
	res.render('tag',{tags, title: 'Tags', tag, stores});
	//res.json(stores);
};

exports.searchStores = async (req, res) => {
	const stores = await Store
	//first find stores that match
	.find({
		$text: {
			$search: req.query.q
		}
	},{
		score: {$meta: 'textScore'}
	})
	//then sort them
	.sort({
		score: {$meta:'textScore'}
	})
	//limit to only 5 results
	.limit(5);
	res.json(stores);
}

exports.mapStores = async (req, res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
	//res.json(coordinates);
	const q = {
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: coordinates
				},
				$maxDistance: 8000 // 10km
			}
		}
	};

	const stores = await Store.find(q).select('slug name description location photo').limit(10);
	res.json(stores);
};

exports.mapPage = async (req, res) => {
	res.render('map', {title: 'Map'});
}

exports.heartStore = async (req, res) => {
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User
		.findByIdAndUpdate(req.user._id,
		{[operator]: {hearts: req.params.id}},
		{new: true}
	);
	res.json(user);
}