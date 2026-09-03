// HTTP layer of the requests module. It receives HTTP information, picks the
// operation, and returns HTTP responses.

import express from "express";
import {
  listRequests,
  getRequest,
  createRequest,
  patchRequest,
  getHistory,
  AppError
} from "./requests.service.js";

const router = express.Router();

function errorBody(code, message) {
  return { error: { code, message } };
}

function translateError(res, error) {
  if (error instanceof AppError) {
    const statusMap = { contract: 400, resource: 404, domain: 409 };
    const status = statusMap[error.category] ?? 500;
    return res.status(status).json(errorBody(error.code, error.message));
  }

  console.error("[requests] unexpected error:", error.message);
  return res.status(500).json(errorBody("INTERNAL_ERROR", "An unexpected error occurred."));
}

router.get("/", async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filters = {};
    if (status !== undefined) filters.status = status;
    if (priority !== undefined) filters.priority = priority;
    res.status(200).json(await listRequests(filters));
  } catch (error) {
    translateError(res, error);
  }
});

router.get("/:id/history", async (req, res) => {
  try {
    const id = Number(req.params.id);
    res.status(200).json(await getHistory(id));
  } catch (error) {
    translateError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    res.status(200).json(await getRequest(id));
  } catch (error) {
    translateError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, priority } = req.body ?? {};
    res.status(201).json(await createRequest({ title, description, priority }));
  } catch (error) {
    translateError(res, error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    res.status(200).json(await patchRequest(id, req.body ?? {}));
  } catch (error) {
    translateError(res, error);
  }
});

export default router;
