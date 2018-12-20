export const getStore = (req, res) => {
	const storeId = req.params.id;
	res.send(storeId);
}