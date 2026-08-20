const crypto = require('crypto');

const jobs = new Map();
const JOB_TTL_MS = 60 * 60 * 1000;

function createJob() {
  const jobId = crypto.randomUUID();
  const job = {
    jobId,
    status: 'processing',
    progress: 0,
    message: 'Starting ingestion',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  jobs.set(jobId, job);
  return job;
}

function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (!job) return null;

  const updatedJob = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  jobs.set(jobId, updatedJob);
  return updatedJob;
}

function getJob(jobId) {
  return jobs.get(jobId) || null;
}

setInterval(() => {
  const expiry = Date.now() - JOB_TTL_MS;
  for (const [jobId, job] of jobs.entries()) {
    if (new Date(job.updatedAt).getTime() < expiry) jobs.delete(jobId);
  }
}, JOB_TTL_MS).unref();

module.exports = { createJob, updateJob, getJob };