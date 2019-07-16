const cloudinary = require('cloudinary').v2;
cloudinary.config({
	cloud_name: 'storystore',
	api_key: '919786561719275',
	api_secret: 'BlziThGcoM8DzWgapIQoAMwJWBM',
});
module.exports = class Cloudinary {
	constructor(cloudName, mappedFolder) {
		this.cloudName = cloudName;
		this.mappedFolder = mappedFolder;
	}

	async autoUploadImage(storeFolder, productName, imageUrl) {
		try {
			// const uploadedImage = await cloudinary.image(
			// 	this.mappedFolder + '/' + remoteResourcePath
			// );
			console.log(
				'cloudinary connector / autoUploadImage / imageUrl',
				imageUrl
			);
			const uploadedImage = await cloudinary.uploader.upload(imageUrl, {
				public_id: storeFolder + '/' + productName,
				eager: [{ width: 562, height: 1000, crop: 'crop', gravity: 'auto' }],
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
