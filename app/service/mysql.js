'use strict';

const Service = require('egg').Service;

class MysqlService extends Service {
  consoleQuery(sql, params) {
    const { ctx: { app: { mysql } } } = this;
    const xprofiler_console = mysql.get('xprofiler_console');
    return xprofiler_console.query(sql, params);
  }

  logsQuery(sql, params) {
    const { ctx: { app: { mysql } } } = this;
    const xprofiler_logs = mysql.get('xprofiler_logs');
    return xprofiler_logs.query(sql, params);
  }

  /* table <user> */
  getUserByName(name) {
    const sql = 'SELECT * FROM user WHERE name = ?';
    const params = [name];
    return this.consoleQuery(sql, params).then(data => data[0]);
  }

  saveUser(name, pass, identity) {
    const sql = 'INSERT INTO user (name, pass, identity) VALUES (?, ?, ?)';
    const params = [name, pass, identity];
    return this.consoleQuery(sql, params);
  }

  getUserByIdentity(identity) {
    const sql = 'SELECT * FROM user WHERE identity = ?';
    const params = [identity];
    return this.consoleQuery(sql, params).then(data => data[0]);
  }

  getUserByUserIds(userIds) {
    if (!userIds.length) {
      return [];
    }
    const sql = `SELECT * FROM user WHERE id in (${userIds.map(() => '?').join(',')})`;
    const params = [...userIds];
    return this.consoleQuery(sql, params);
  }

  /* table <apps> */
  getMyApps(userId) {
    const sql = 'SELECT * FROM apps WHERE owner = ? ORDER BY gm_modified ASC';
    const params = [userId];
    return this.consoleQuery(sql, params);
  }

  getJoinedApps(userId, status) {
    const sql = 'SELECT * FROM apps WHERE id in (SELECT app FROM members WHERE user = ? AND status = ?) ORDER BY gm_modified ASC';
    const params = [userId, status];
    return this.consoleQuery(sql, params);
  }

  saveApp(userId, appName, secret) {
    const sql = 'INSERT INTO apps (name, owner, secret) VALUES (?, ?, ?)';
    const params = [appName, userId, secret];
    return this.consoleQuery(sql, params);
  }

  renameApp(appId, newAppName) {
    const sql = 'UPDATE apps SET name = ? WHERE id = ?';
    const params = [newAppName, appId];
    return this.consoleQuery(sql, params);
  }

  getAppByAppId(appId) {
    const sql = 'SELECT * FROM apps WHERE id = ?';
    const params = [appId];
    return this.consoleQuery(sql, params).then(data => data[0] || {});
  }

  deleteAppByAppId(appId) {
    const sql = 'DELETE FROM apps WHERE id = ?';
    const params = [appId];
    return this.consoleQuery(sql, params);
  }

  checkAppOwnerByUserId(appId, userId) {
    const sql = 'SELECT * FROM apps WHERE id = ? AND owner = ?';
    const params = [appId, userId];
    return this.consoleQuery(sql, params).then(data => data[0]);
  }

  checkAppMemberByUserId(appId, userId, status) {
    const sql = 'SELECT * FROM apps WHERE id in (SELECT app FROM members WHERE app = ? AND user = ? AND status = ?)';
    const params = [appId, userId, status];
    return this.consoleQuery(sql, params).then(data => data[0]);
  }

  updateAppOwner(appId, userId) {
    const sql = 'UPDATE apps SET owner = ? WHERE id = ?';
    const params = [userId, appId];
    return this.consoleQuery(sql, params);
  }

  /* table <files> */
  getFiles(appId, type) {
    let sql = '';
    let params = [];
    if (type === 'all') {
      sql = 'SELECT * FROM files WHERE app = ?';
      params = [appId];
    } else if (type === 'favor') {
      sql = 'SELECT * FROM files WHERE app = ? AND favor = ?';
      params = [appId, 1];
    } else {
      sql = 'SELECT * FROM files WHERE app = ? AND type = ?';
      params = [appId, type];
    }
    sql += ' ORDER BY gm_create DESC';
    return this.consoleQuery(sql, params);
  }

  addFile(appId, agentId, type, file, user) {
    const sql = 'INSERT INTO files (app, agent, type, file, user) '
      + 'VALUES (?, ?, ?, ?, ?)';
    const params = [appId, agentId, type, file, user];
    return this.consoleQuery(sql, params);
  }

  getFileByIdAndType(fileId, fileType) {
    const sql = 'SELECT * FROM files WHERE id = ? AND type = ?';
    const params = [fileId, fileType];
    return this.consoleQuery(sql, params).then(data => data[0]);
  }

  updateFileStatusById(fileId, status, token = '', storage) {
    let sql = '';
    let params = [];
    if (storage) {
      sql = 'UPDATE files SET status = ?, token = ?, storage = ? WHERE id = ?';
      params = [status, token, storage, fileId];
    } else {
      sql = 'UPDATE files SET status = ?, token = ? WHERE id = ?';
      params = [status, token, fileId];
    }
    return this.consoleQuery(sql, params);
  }

  deleteFileById(fileId) {
    const sql = 'DELETE FROM files WHERE id = ?';
    const params = [fileId];
    return this.consoleQuery(sql, params);
  }

  deleteFiles(appId) {
    const sql = 'DELETE FROM files WHERE app = ?';
    const params = [appId];
    return this.consoleQuery(sql, params);
  }

  updateFileFavor(fileId, favor) {
    const sql = 'UPDATE files SET favor = ? WHERE id = ?';
    const params = [favor, fileId];
    return this.consoleQuery(sql, params);
  }

  /* table <members> */
  getTeamMembersByAppId(appId) {
    const sql = 'SELECT * FROM members WHERE app = ?';
    const params = [appId];
    return this.consoleQuery(sql, params);
  }

  inviteMember(appId, invitedUser, status) {
    const sql = 'INSERT INTO members (app, user, status) VALUES (?, ?, ?)';
    const params = [appId, invitedUser, status];
    return this.consoleQuery(sql, params);
  }

  confirmInvitation(invitedApp, userId) {
    const sql = 'UPDATE members SET status = ? WHERE app = ? AND user = ?';
    const params = [2, invitedApp, userId];
    return this.consoleQuery(sql, params);
  }

  deleteMember(appId, userId) {
    const sql = 'DELETE FROM members WHERE app = ? AND user = ?';
    const params = [appId, userId];
    return this.consoleQuery(sql, params);
  }

  deleteMembersByAppId(appId) {
    const sql = 'DELETE FROM members WHERE app = ?';
    const params = [appId];
    return this.consoleQuery(sql, params);
  }

  /* process_${DD} or osinfo_${DD} */
  getXnppLogs(table, appId, agentId, start, end, pid) {
    const sql = `SELECT * FROM ${table} WHERE app = ? AND agent = ? `
      + 'AND log_time >= ? AND log_time < ? '
      + (pid ? 'AND pid = ?' : '')
      + 'ORDER BY log_time DESC';
    const params = [appId, agentId, start, end];
    if (pid) {
      params.push(pid);
    }
    return this.logsQuery(sql, params);
  }
}

module.exports = MysqlService;
