const recordsService = require('./records.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const listRecords = asyncHandler(async (req, res) => {
  const { records, total, page, limit, totalPages } = await recordsService.listRecords(req.query);
  res.status(200).json(
    new ApiResponse(200, 'Records retrieved successfully.', records, { total, page, limit, totalPages })
  );
});

const getRecordById = asyncHandler(async (req, res) => {
  const record = await recordsService.getRecordById(parseInt(req.params.id));
  res.status(200).json(new ApiResponse(200, 'Record retrieved successfully.', record));
});

const createRecord = asyncHandler(async (req, res) => {
  const record = await recordsService.createRecord(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, 'Record created successfully.', record));
});

const updateRecord = asyncHandler(async (req, res) => {
  const record = await recordsService.updateRecord(parseInt(req.params.id), req.body);
  res.status(200).json(new ApiResponse(200, 'Record updated successfully.', record));
});

const deleteRecord = asyncHandler(async (req, res) => {
  await recordsService.deleteRecord(parseInt(req.params.id));
  res.status(200).json(new ApiResponse(200, 'Record deleted successfully.'));
});

module.exports = { listRecords, getRecordById, createRecord, updateRecord, deleteRecord };
