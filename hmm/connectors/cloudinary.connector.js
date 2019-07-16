const cloudinary = require('cloudinary').v2;
cloudinary.config({
	cloud_name: 'storystore',
	api_key: '919786561719275',
	api_secret: 'BlziThGcoM8DzWgapIQoAMwJWBM',
});
module.exports = class Cloudinary {
	constructor() {}

	async autoUploadImage(storeFolder, productName, imageUrl) {
		try {
			console.log(
				'cloudinary connector / autoUploadImage / imageUrl',
				imageUrl
			);
			const uploadedImage = await cloudinary.uploader.upload(imageUrl, {
				public_id: storeFolder + '/' + productName + '/' + productName,
				eager: [
					{ width: 562, height: 1000, crop: 'lfill', gravity: 'auto:object' },
				],
				invalidate: true,
			});
			return uploadedImage['secure_url'];
		} catch (err) {
			console.error(
				'Cloudinary Connector / autoUploadImage ERROR',
				JSON.stringify(err)
			);
		}
	}
};
