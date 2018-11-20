import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserRecord } from 'firebase-functions/lib/providers/auth';
import { Position } from '../../src/app/models/position';
import { IMetrics } from '../../src/app/models/metric';

admin.initializeApp();
const store = admin.firestore();

const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
const secureCompare = require('secure-compare');
const MAX_CONCURRENT = 3;

const date = new Date(),
  y = date.getFullYear(),
  m = date.getMonth();
const firstDay = new Date(y, m, 1);

// MARK: Update Metrics

exports.updateMetrics = functions.https.onRequest((req, res) => {
  const key = req.query.key;

  // Exit if the keys don't match.
  if (!secureCompare(key, functions.config().cron.key)) {
    console.log(
      'The key provided in the request does not match the key set in the environment. Check that',
      key,
      'matches the cron.key attribute in `firebase env:get`'
    );
    res
      .status(403)
      .send(
        'Security key does not match. Make sure your "key" URL query parameter matches the ' +
          'cron.key environment variable.'
      );
    return null;
  }

  // Fetch all user.
  return getUsers()
    .then(users => {
      // Use a pool so that we delete maximum `MAX_CONCURRENT` users in parallel.
      const pool = new PromisePool(
        () => runMetricsAnalysis(users),
        MAX_CONCURRENT
      );
      return pool.start();
    })
    .then(() => {
      console.log('metrics updated:', firstDay);
      res.send(`metrics updated: ${firstDay}`);
      return null;
    });
});

/**
 * Returns the list of all users.
 */
function getUsers(users: UserRecord[] = [], nextPageToken?: string) {
  let tempUsers: UserRecord[] = users;
  return admin
    .auth()
    .listUsers(1000, nextPageToken)
    .then(result => {
      // Concat with list of previously found users if there was more than 1000 users.
      tempUsers = tempUsers.concat(result.users);

      // If there are more users to fetch we fetch them.
      if (result.pageToken) {
        return getUsers(tempUsers, result.pageToken);
      }

      return tempUsers;
    });
}

function runMetricsAnalysis(users: UserRecord[]) {
  if (users.length > 0) {
    const user = users.pop();
    if (user != null) {
      return getPositions(user)
        .then(positions => {
          const metrics = generateMetrics(positions);
          return writeMetrics(user.uid, metrics).catch(function(err) {
            console.error(err);
            return null;
          });
        })
        .catch(function(err) {
          console.error(err);
          return null;
        });
    }
    return null;
  }
  return null;
}

/**
 * Returns the list of positions for the previous month.
 */
function getPositions(user: UserRecord) {
  return store
    .collection(`users/${user.uid}/positions`)
    .orderBy('postedDate', 'desc')
    .get()
    .then(querySnapshot => querySnapshot.docs.map(doc => doc.data()));
}

/**
 * Generate metrics from positions
 */
function generateMetrics(positions: Array<any>): IMetrics {
  let portfolioValue = 0;
  let profitLoss = 0;
  let fees = 0;
  if (positions.length > 0) {
    positions
      .map(position => new Position(position))
      .map(position => {
        portfolioValue += position.positionValue;
        profitLoss += position.profitLossClosedQuantity;
        fees += position.fees;
      });
  }

  const IMetric = {
    portfolioValue: portfolioValue,
    profitLoss: profitLoss,
    fees: fees
  };
  return IMetric;
}

/**
 * write metrics into firehase
 */
function writeMetrics(userID: string, metrics: IMetrics) {
  const newMetricsDoc = store
    .collection(`users/${userID}/metrics`)
    .doc(firstDay.toString());
  return newMetricsDoc.set(metrics);
}
