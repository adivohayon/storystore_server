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
				eager: [
					{
						width: '720',
						height: '1280',
						crop: 'pad',
						format: 'jpg',
						flags: 'progressive',
					},
					{
						width: '720',
						height: '1280',
						crop: 'pad',
						format: 'webp',
					},
				],
				invalidate: true,
			});

			console.log('uploadedImage', uploadedImage);

			let cloudinaryUrls = [];
			if (uploadedImage['eager']) {
				for (let trans of uploadedImage['eager']) {
					const cloudinaryUrl = _.get(trans, 'secure_url', null);
					cloudinaryUrls.push(cloudinaryUrl);
				}
			} else {
				console.log('secure Url not found', uploadedImage);
				throw new Error('secure Url not found');
			}

			console.log('cloudinaryUrl', cloudinaryUrls);
			// console.log('cloudinaryUrl length', cloudinaryUrl.length);
			console.log(
				'---------------------------------------------------------------------------'
			);
			return cloudinaryUrls;
		} catch (err) {
			console.error(
				'ERROR :: CLOUDINARY SERVICE / uploadImageFromUrl',
				err.toString()
			);
		}
	}

	deleteAssetsFolder(storeSlug) {
		return new Promise((resolve, reject) => {
			cloudinary.api.delete_resources_by_prefix(
				'mikibuganim',
				(err, result) => {
					if (err) reject(err);

					resolve(result);
				}
			);
		});
	}
};
