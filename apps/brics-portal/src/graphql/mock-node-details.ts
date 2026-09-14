// ---------------------------------------------------------------------------
// Per-country node training history and update submission records.
// Mocked realistic data for node detail charts and submission logs.
// ---------------------------------------------------------------------------

export interface NodeTrainingMetric {
  round: string;
  roundNumber: number;
  loss: number;
  accuracy: number;
  validationLoss: number;
  samples: number;
}

export interface NodeSubmissionLog {
  id: string;
  roundId: string;
  submittedAt: string;
  status: 'submitted' | 'rejected' | 'timeout';
  weightDeltaHash: string;
  sampleCount: number;
  localLoss: number;
}

export const mockNodeHistories: Record<
  string,
  {
    trainingHistory: NodeTrainingMetric[];
    submissions: NodeSubmissionLog[];
  }
> = {
  IN: {
    trainingHistory: [
      { round: 'R-013', roundNumber: 13, loss: 0.285, accuracy: 0.842, validationLoss: 0.312, samples: 15400 },
      { round: 'R-014', roundNumber: 14, loss: 0.241, accuracy: 0.865, validationLoss: 0.278, samples: 15800 },
      { round: 'R-015', roundNumber: 15, loss: 0.210, accuracy: 0.884, validationLoss: 0.239, samples: 16100 },
      { round: 'R-016', roundNumber: 16, loss: 0.182, accuracy: 0.902, validationLoss: 0.208, samples: 16250 },
      { round: 'R-017', roundNumber: 17, loss: 0.165, accuracy: 0.915, validationLoss: 0.191, samples: 16180 },
      { round: 'R-018', roundNumber: 18, loss: 0.149, accuracy: 0.928, validationLoss: 0.175, samples: 16300 },
    ],
    submissions: [
      {
        id: 'sub-in-018',
        roundId: 'round-2026-09-09-018',
        submittedAt: '2026-09-10T14:00:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:7f8a92...b941',
        sampleCount: 16300,
        localLoss: 0.149,
      },
      {
        id: 'sub-in-017',
        roundId: 'round-2026-09-08-017',
        submittedAt: '2026-09-09T13:48:12.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:1a2c3d...e890',
        sampleCount: 16180,
        localLoss: 0.165,
      },
      {
        id: 'sub-in-016',
        roundId: 'round-2026-09-07-016',
        submittedAt: '2026-09-08T14:15:40.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:9c8b7a...3210',
        sampleCount: 16250,
        localLoss: 0.182,
      },
      {
        id: 'sub-in-015',
        roundId: 'round-2026-09-06-015',
        submittedAt: '2026-09-07T12:59:10.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:4d5e6f...8765',
        sampleCount: 16100,
        localLoss: 0.210,
      },
      {
        id: 'sub-in-014',
        roundId: 'round-2026-09-05-014',
        submittedAt: '2026-09-06T13:30:22.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:2b3c4d...5678',
        sampleCount: 15800,
        localLoss: 0.241,
      },
    ],
  },
  BR: {
    trainingHistory: [
      { round: 'R-013', roundNumber: 13, loss: 0.312, accuracy: 0.819, validationLoss: 0.345, samples: 39500 },
      { round: 'R-014', roundNumber: 14, loss: 0.278, accuracy: 0.841, validationLoss: 0.308, samples: 40200 },
      { round: 'R-015', roundNumber: 15, loss: 0.239, accuracy: 0.868, validationLoss: 0.265, samples: 40800 },
      { round: 'R-016', roundNumber: 16, loss: 0.211, accuracy: 0.887, validationLoss: 0.231, samples: 41000 },
      { round: 'R-017', roundNumber: 17, loss: 0.188, accuracy: 0.902, validationLoss: 0.212, samples: 41067 },
      { round: 'R-018', roundNumber: 18, loss: 0.170, accuracy: 0.916, validationLoss: 0.194, samples: 41200 },
    ],
    submissions: [
      {
        id: 'sub-br-018',
        roundId: 'round-2026-09-09-018',
        submittedAt: '2026-09-10T13:45:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:b8c9d0...f123',
        sampleCount: 41200,
        localLoss: 0.170,
      },
      {
        id: 'sub-br-017',
        roundId: 'round-2026-09-08-017',
        submittedAt: '2026-09-09T13:20:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:d1e2f3...4567',
        sampleCount: 41067,
        localLoss: 0.188,
      },
      {
        id: 'sub-br-016',
        roundId: 'round-2026-09-07-016',
        submittedAt: '2026-09-08T13:55:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:5a6b7c...8901',
        sampleCount: 41000,
        localLoss: 0.211,
      },
      {
        id: 'sub-br-015',
        roundId: 'round-2026-09-06-015',
        submittedAt: '2026-09-07T14:10:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:2c3d4e...6789',
        sampleCount: 40800,
        localLoss: 0.239,
      },
      {
        id: 'sub-br-014',
        roundId: 'round-2026-09-05-014',
        submittedAt: '2026-09-06T12:45:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:9f0a1b...2345',
        sampleCount: 40200,
        localLoss: 0.278,
      },
    ],
  },
  RU: {
    trainingHistory: [
      { round: 'R-013', roundNumber: 13, loss: 0.298, accuracy: 0.835, validationLoss: 0.320, samples: 21800 },
      { round: 'R-014', roundNumber: 14, loss: 0.262, accuracy: 0.857, validationLoss: 0.285, samples: 22100 },
      { round: 'R-015', roundNumber: 15, loss: 0.228, accuracy: 0.879, validationLoss: 0.251, samples: 22350 },
      { round: 'R-016', roundNumber: 16, loss: 0.199, accuracy: 0.898, validationLoss: 0.222, samples: 22400 },
      { round: 'R-017', roundNumber: 17, loss: 0.178, accuracy: 0.911, validationLoss: 0.201, samples: 22450 },
      { round: 'R-018', roundNumber: 18, loss: 0.158, accuracy: 0.924, validationLoss: 0.182, samples: 22500 },
    ],
    submissions: [
      {
        id: 'sub-ru-018',
        roundId: 'round-2026-09-09-018',
        submittedAt: '2026-09-09T12:30:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:3e4f5a...6b7c',
        sampleCount: 22500,
        localLoss: 0.158,
      },
      {
        id: 'sub-ru-017',
        roundId: 'round-2026-09-08-017',
        submittedAt: '2026-09-08T11:45:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:8d9e0f...1a2b',
        sampleCount: 22450,
        localLoss: 0.178,
      },
      {
        id: 'sub-ru-016',
        roundId: 'round-2026-09-07-016',
        submittedAt: '2026-09-07T12:15:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:5c6d7e...8f9a',
        sampleCount: 22400,
        localLoss: 0.199,
      },
      {
        id: 'sub-ru-015',
        roundId: 'round-2026-09-06-015',
        submittedAt: '2026-09-06T13:00:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:2b3c4d...5e6f',
        sampleCount: 22350,
        localLoss: 0.228,
      },
      {
        id: 'sub-ru-014',
        roundId: 'round-2026-09-05-014',
        submittedAt: '2026-09-05T12:10:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:7a8b9c...0d1e',
        sampleCount: 22100,
        localLoss: 0.262,
      },
    ],
  },
  CN: {
    trainingHistory: [
      { round: 'R-013', roundNumber: 13, loss: 0.270, accuracy: 0.852, validationLoss: 0.295, samples: 34000 },
      { round: 'R-014', roundNumber: 14, loss: 0.235, accuracy: 0.874, validationLoss: 0.260, samples: 34600 },
      { round: 'R-015', roundNumber: 15, loss: 0.208, accuracy: 0.891, validationLoss: 0.232, samples: 35000 },
      { round: 'R-016', roundNumber: 16, loss: 0.185, accuracy: 0.906, validationLoss: 0.210, samples: 35150 },
      { round: 'R-017', roundNumber: 17, loss: 0.170, accuracy: 0.915, validationLoss: 0.195, samples: 35200 },
      { round: 'R-018', roundNumber: 18, loss: 0.160, accuracy: 0.921, validationLoss: 0.188, samples: 35200 },
    ],
    submissions: [
      {
        id: 'sub-cn-018',
        roundId: 'round-2026-09-09-018',
        submittedAt: '2026-09-08T11:00:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:6b7c8d...9e0f',
        sampleCount: 35200,
        localLoss: 0.160,
      },
      {
        id: 'sub-cn-017',
        roundId: 'round-2026-09-08-017',
        submittedAt: '2026-09-07T10:30:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:1f2a3b...4c5d',
        sampleCount: 35200,
        localLoss: 0.170,
      },
      {
        id: 'sub-cn-016',
        roundId: 'round-2026-09-07-016',
        submittedAt: '2026-09-06T11:15:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:8e9f0a...1b2c',
        sampleCount: 35150,
        localLoss: 0.185,
      },
      {
        id: 'sub-cn-015',
        roundId: 'round-2026-09-06-015',
        submittedAt: '2026-09-05T12:00:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:3d4e5f...6a7b',
        sampleCount: 35000,
        localLoss: 0.208,
      },
      {
        id: 'sub-cn-014',
        roundId: 'round-2026-09-05-014',
        submittedAt: '2026-09-04T10:45:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:0c1d2e...3f4a',
        sampleCount: 34600,
        localLoss: 0.235,
      },
    ],
  },
  ZA: {
    trainingHistory: [
      { round: 'R-013', roundNumber: 13, loss: 0.335, accuracy: 0.805, validationLoss: 0.368, samples: 13800 },
      { round: 'R-014', roundNumber: 14, loss: 0.294, accuracy: 0.832, validationLoss: 0.325, samples: 14050 },
      { round: 'R-015', roundNumber: 15, loss: 0.258, accuracy: 0.856, validationLoss: 0.288, samples: 14200 },
      { round: 'R-016', roundNumber: 16, loss: 0.229, accuracy: 0.878, validationLoss: 0.252, samples: 14300 },
      { round: 'R-017', roundNumber: 17, loss: 0.205, accuracy: 0.894, validationLoss: 0.228, samples: 14332 },
      { round: 'R-018', roundNumber: 18, loss: 0.185, accuracy: 0.908, validationLoss: 0.205, samples: 14400 },
    ],
    submissions: [
      {
        id: 'sub-za-018',
        roundId: 'round-2026-09-09-018',
        submittedAt: '2026-09-10T15:15:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:4a5b6c...7d8e',
        sampleCount: 14400,
        localLoss: 0.185,
      },
      {
        id: 'sub-za-017',
        roundId: 'round-2026-09-08-017',
        submittedAt: '2026-09-09T14:30:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:9d0e1f...2a3b',
        sampleCount: 14332,
        localLoss: 0.205,
      },
      {
        id: 'sub-za-016',
        roundId: 'round-2026-09-07-016',
        submittedAt: '2026-09-08T15:00:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:6c7d8e...9f0a',
        sampleCount: 14300,
        localLoss: 0.229,
      },
      {
        id: 'sub-za-015',
        roundId: 'round-2026-09-06-015',
        submittedAt: '2026-09-07T14:20:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:1b2c3d...4e5f',
        sampleCount: 14200,
        localLoss: 0.258,
      },
      {
        id: 'sub-za-014',
        roundId: 'round-2026-09-05-014',
        submittedAt: '2026-09-06T13:50:00.000Z',
        status: 'submitted',
        weightDeltaHash: 'sha256:8a9b0c...1d2e',
        sampleCount: 14050,
        localLoss: 0.294,
      },
    ],
  },
};
