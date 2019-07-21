const _ = require('lodash');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
	cloud_name: 'storystore',
	api_key: '919786561719275',
	api_secret: 'BlziThGcoM8DzWgapIQoAMwJWBM',
});
module.exports = class Cloudinary {
	constructor() {}

	async uploadImageFromUrl(
		assetUrl,
		storeSlug,
		shelfSlug,
		variationSlug,
		assetIndex = 1
	) {
		try {
			console.log(
				'CLOUDINARY SERVICE / uploadImageFromUrl / assetUrl',
				assetUrl
			);
			
			console.log(
				'---------------------------------------------------------------------------'
			);
			const publicId = `${storeSlug}/${shelfSlug}/${variationSlug}/${assetIndex}`;
			console.log('publicId length', publicId.length);
			const uploadedImage = await cloudinary.uploader.upload(assetUrl, {
				public_id: publicId,
				eager: [{ width: 562, height: 1000, crop: 'lfill', gravity: 'auto' }],
				invalidate: true,
			});

			// console.log('uploadedImage', uploadedImage);
	

			let cloudinaryUrl;
			if (uploadedImage['secure_url']) {
				cloudinaryUrl = _.get(
					uploadedImage,
					'eager[0].secure_url',
					uploadedImage['secure_url']
				);
			} else {
				console.log('secure Url not found', uploadedImage);
				throw new Error('secure Url not found');
			}

			console.log('cloudinaryUrl', cloudinaryUrl);
			console.log('cloudinaryUrl length', cloudinaryUrl.length);
			console.log(
				'---------------------------------------------------------------------------'
			);
			return cloudinaryUrl;
		} catch (err) {
			console.error(
				'ERROR :: CLOUDINARY SERVICE / uploadImageFromUrl',
				err.toString()
			);
		}
	}
};
