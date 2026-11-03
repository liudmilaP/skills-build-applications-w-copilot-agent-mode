import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' ||
    !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Valid userId, teamId, type, and positive minutes are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user and team must exist'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot, members = [] } = input;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw Object.assign(new Error('A team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw Object.assign(new Error('A team mascot is required'), { status: 400 });
  }
  if (!Array.isArray(members) || !members.every((member) => typeof member === 'string' && Types.ObjectId.isValid(member))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const memberIds = [...new Set(members)];
  const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
  if (existingMembers !== memberIds.length) {
    throw Object.assign(new Error('Team members must exist'), { status: 404 });
  }

  return Team.create({ name, mascot, members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    { $set: { totalPoints: { $sum: '$activities.points' } } },
    { $sort: { totalPoints: -1, name: 1, _id: 1 } },
    { $project: { _id: 0, teamName: '$name', totalPoints: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = recentActivity?.type.toLowerCase() === 'run' ||
    recentActivity?.type.toLowerCase() === 'cycle' ||
    recentActivity?.type.toLowerCase() === 'walk'
    ? 'endurance'
    : recentActivity?.type.toLowerCase();
  const focusCandidates = [user.fitnessGoal?.toLowerCase(), activityFocus]
    .filter((focus): focus is string => Boolean(focus));
  const workouts = await Workout.find().lean();
  const preferredFocus = focusCandidates.find((focus) =>
    workouts.some((workout) => workout.focus.toLowerCase() === focus),
  );
  if (!preferredFocus) return [];

  const reason = `Recommended for your ${preferredFocus} goal${recentActivity ? ` and recent ${recentActivity.type} activity` : ''}.`;
  return workouts
    .filter((workout) => workout.focus.toLowerCase() === preferredFocus)
    .map((workout) => ({ ...workout, reason }));
}

export { User };
