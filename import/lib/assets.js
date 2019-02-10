import fs from 'fs';
import path from 'path';

export const createAssetPath = (
	storeId,
	storeSlug,
	shelfId,
	shelfSlug,
	variationId,
	imageIndex
) => {
	return `/assets/${storeSlug}/${shelfId}_${shelfSlug}/${storeId}_${shelfId}_${variationId}_${imageIndex}.jpg`;
};

export const assetsByDirectory = storeSlug => {
	const assetsDir = path.resolve(
		__dirname,
		'../',
		'stores',
		storeSlug,
		'assets'
	);
	const isDirectory = source => fs.lstatSync(source).isDirectory();

	// Get all directories for store
	const directories = fs
		.readdirSync(assetsDir)
		.map(name => path.join(assetsDir, name))
		.filter(isDirectory)
		.map(directory => {
			const dirPathArr = directory.split('/');
			return dirPathArr[dirPathArr.length - 1];
		});

	// Loop through each directory and create a map of directory => assets
	const assets = {};
	const extensionsRegex = /\.(jpe?g|jpg|png|gif|mp4)$/gi;
	directories.forEach(dir => {
		const files = fs.readdirSync(path.join(assetsDir, dir));
		const assetsFiles = files.filter(file => extensionsRegex.test(file));
		assets[dir] = assetsFiles;
	});

	return assets;
};

export const assetsByVariationId = (assets, variationId) => {
	if (assets && assets.length && variationId) {
		return assets.filter(asset => {
			return asset.split('_')[2] == variationId;
		});
	}
};
export const injectAssets = async (
	variations,
	storeId,
	storeSlug,
	idToSlugMap
) => {
	let previousVariationId = 1;
	const assetsByDir = assetsByDirectory(storeSlug);

	variations.forEach(variant => {
		let imageIndex = 1;
		const shelfSlug = idToSlugMap[variant.shelf_id];

		const directory = `${variant.shelf_id}_${shelfSlug}`;
		const allShelfAssets = assetsByDir[directory];

		// console.log('allShelfAssets', allShelfAssets);
		const variationAssets = assetsByVariationId(allShelfAssets, variant.variation_id);

		variant.content = variationAssets;
		// console.log(variant.variation_id, variationAssets);
		// const path = createAssetPath(
		// 	storeId,
		// 	storeSlug,
		// 	variant.shelf_id,
		// 	shelfSlug,
		// 	variant.variation_id,
		// 	imageIndex
		// );

		// loop through variation images

		// Handle image indexes
		if (variant.variation_id === previousVariationId) {
			imageIndex++;
		} else {
			imageIndex = 1;
		}
		previousVariationId = variant.variation_id;

		// console.log('shelfSlug', shelfSlug);
		// console.log(shelfSlug + '::::' + variant.variation_id + '::::', path);
	});
};
