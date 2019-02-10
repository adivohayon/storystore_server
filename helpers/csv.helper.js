const fs = require('fs');
const csv = require('csvtojson');

export class CSV {
	constructor(csvFilePath) {
		console.log('csvFilePath', csvFilePath);
		this.filepath = csvFilePath;
		this.jsonArray = [];
	}

	toJSON() {
		return csv().fromFile(this.filepath);
	}
}
