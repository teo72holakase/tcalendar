const mongoose = require('mongoose');
const Group = require('../models/Group');
const Event = require('../models/Event');
const GroupPost = require('../models/GroupPost');
const GroupComment = require('../models/GroupComment');
const GroupResource = require('../models/GroupResource');
const { isAdmin } = require('../utils/admin');

const PAGE_SIZE = 20;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isMember = (group, userId) => group.members.some((member) => member.toString() === userId.toString());
const canModerate = (group, user) => group.creator.toString() === user._id.toString() || isAdmin(user);
const boundedText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const validUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};

const attachMentions = async (items, groupId) => {
  const mentions = items.map((item) => ({
    item,
    events: [...new Set([...item.content.matchAll(/\/([a-f\d]{24})\b/gi)].map((match) => match[1].toLowerCase()))],
    resources: [...new Set([...item.content.matchAll(/!([a-f\d]{24})\b/gi)].map((match) => match[1].toLowerCase()))],
  }));
  const eventIds = [...new Set(mentions.flatMap(({ events }) => events))].slice(0, 40);
  const resourceIds = [...new Set(mentions.flatMap(({ resources }) => resources))].slice(0, 40);
  const [events, resources] = await Promise.all([
    eventIds.length ? Event.find({ group: groupId, _id: { $in: eventIds } }).select('_id title dueDate').lean() : [],
    resourceIds.length ? GroupResource.find({ group: groupId, _id: { $in: resourceIds } }).select('_id title url').lean() : [],
  ]);
  const eventById = new Map(events.map((event) => [String(event._id), event]));
  const resourceById = new Map(resources.map((resource) => [String(resource._id), resource]));
  return mentions.map(({ item, events: eventRefs, resources: resourceRefs }) => ({
    ...item.toObject(),
    eventRefs: Object.fromEntries(eventRefs.flatMap((id) => eventById.has(id) ? [[id, eventById.get(id)]] : [])),
    resourceRefs: Object.fromEntries(resourceRefs.flatMap((id) => resourceById.has(id) ? [[id, resourceById.get(id)]] : [])),
  }));
};

const getMemberGroup = async (groupId, user, res) => {
  const group = await Group.findById(groupId).select('creator members');
  if (!group) {
    res.status(404).json({ message: 'Grupo no encontrado' });
    return null;
  }
  if (!isMember(group, user._id)) {
    res.status(403).json({ message: 'No tenés acceso a este grupo' });
    return null;
  }
  return group;
};

const listPage = async (model, filter, cursor) => {
  const query = { ...filter };
  if (cursor) {
    if (!mongoose.isValidObjectId(cursor)) return null;
    query._id = { $lt: cursor };
  }
  const docs = await model.find(query)
    .select('-__v')
    .populate('author', 'username')
    .sort({ _id: -1 })
    .limit(PAGE_SIZE + 1);
  const hasMore = docs.length > PAGE_SIZE;
  const items = docs.slice(0, PAGE_SIZE);
  return { items, nextCursor: hasMore ? String(items.at(-1)._id) : null };
};

const getPosts = async (req, res) => {
  try {
    if (!(await getMemberGroup(req.params.groupId, req.user, res))) return;
    const result = await listPage(GroupPost, { group: req.params.groupId }, req.query.cursor);
    if (!result) return res.status(400).json({ message: 'Cursor no válido' });
    result.items = await attachMentions(result.items, req.params.groupId);
    res.json(result);
  } catch (error) {
    console.error('Error getGroupPosts:', error);
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
};

const createPost = async (req, res) => {
  try {
    if (!(await getMemberGroup(req.params.groupId, req.user, res))) return;
    if (!boundedText(req.body?.content, 4000)) {
      return res.status(400).json({ message: 'El mensaje es obligatorio (máx. 4000 caracteres)' });
    }
    const post = await GroupPost.create({
      group: req.params.groupId,
      author: req.user._id,
      content: req.body.content.trim(),
    });
    await post.populate('author', 'username');
    res.status(201).json((await attachMentions([post], req.params.groupId))[0]);
  } catch (error) {
    console.error('Error createGroupPost:', error);
    res.status(500).json({ message: 'Error al publicar el mensaje' });
  }
};

const deletePost = async (req, res) => {
  try {
    const group = await getMemberGroup(req.params.groupId, req.user, res);
    if (!group) return;
    const post = await GroupPost.findOne({ _id: req.params.postId, group: req.params.groupId });
    if (!post) return res.status(404).json({ message: 'Mensaje no encontrado' });
    if (post.author.toString() !== req.user._id.toString() && !canModerate(group, req.user)) {
      return res.status(403).json({ message: 'No tenés permiso para borrar este mensaje' });
    }
    await Promise.all([
      GroupComment.deleteMany({ post: post._id }),
      post.deleteOne(),
    ]);
    res.json({ message: 'Mensaje eliminado' });
  } catch (error) {
    console.error('Error deleteGroupPost:', error);
    res.status(500).json({ message: 'Error al eliminar el mensaje' });
  }
};

const getComments = async (req, res) => {
  try {
    if (!(await getMemberGroup(req.params.groupId, req.user, res))) return;
    const postExists = await GroupPost.exists({ _id: req.params.postId, group: req.params.groupId });
    if (!postExists) return res.status(404).json({ message: 'Mensaje no encontrado' });
    const parentId = req.query.parentId || null;
    if (parentId) {
      if (!mongoose.isValidObjectId(parentId)) return res.status(400).json({ message: 'Comentario padre no válido' });
      const parentExists = await GroupComment.exists({
        _id: parentId,
        post: req.params.postId,
        group: req.params.groupId,
      });
      if (!parentExists) return res.status(404).json({ message: 'Comentario padre no encontrado' });
    }
    const result = await listPage(GroupComment, {
      group: req.params.groupId,
      post: req.params.postId,
      parent: parentId,
    }, req.query.cursor);
    if (!result) return res.status(400).json({ message: 'Cursor no válido' });
    result.items = await attachMentions(result.items, req.params.groupId);
    res.json(result);
  } catch (error) {
    console.error('Error getGroupComments:', error);
    res.status(500).json({ message: 'Error al obtener comentarios' });
  }
};

const createComment = async (req, res) => {
  try {
    if (!(await getMemberGroup(req.params.groupId, req.user, res))) return;
    const postExists = await GroupPost.exists({ _id: req.params.postId, group: req.params.groupId });
    if (!postExists) return res.status(404).json({ message: 'Mensaje no encontrado' });
    if (!boundedText(req.body?.content, 2000)) {
      return res.status(400).json({ message: 'El comentario es obligatorio (máx. 2000 caracteres)' });
    }
    const parentId = req.body?.parentId || null;
    if (parentId) {
      if (!mongoose.isValidObjectId(parentId)) return res.status(400).json({ message: 'Comentario padre no válido' });
      const parentExists = await GroupComment.exists({
        _id: parentId,
        post: req.params.postId,
        group: req.params.groupId,
      });
      if (!parentExists) return res.status(404).json({ message: 'Comentario padre no encontrado' });
    }
    const comment = await GroupComment.create({
      group: req.params.groupId,
      post: req.params.postId,
      parent: parentId,
      author: req.user._id,
      content: req.body.content.trim(),
    });
    await comment.populate('author', 'username');
    res.status(201).json((await attachMentions([comment], req.params.groupId))[0]);
  } catch (error) {
    console.error('Error createGroupComment:', error);
    res.status(500).json({ message: 'Error al publicar el comentario' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const group = await getMemberGroup(req.params.groupId, req.user, res);
    if (!group) return;
    const comment = await GroupComment.findOne({
      _id: req.params.commentId,
      post: req.params.postId,
      group: req.params.groupId,
    });
    if (!comment) return res.status(404).json({ message: 'Comentario no encontrado' });
    if (comment.author.toString() !== req.user._id.toString() && !canModerate(group, req.user)) {
      return res.status(403).json({ message: 'No tenés permiso para borrar este comentario' });
    }
    await GroupComment.updateMany({
      group: comment.group,
      post: comment.post,
      parent: comment._id,
    }, { $set: { parent: null } });
    await comment.deleteOne();
    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error deleteGroupComment:', error);
    res.status(500).json({ message: 'Error al eliminar el comentario' });
  }
};

const getResources = async (req, res) => {
  try {
    if (!(await getMemberGroup(req.params.groupId, req.user, res))) return;
    const query = { group: req.params.groupId };
    const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
    if (search) {
      const matches = [{ title: { $regex: `^${escapeRegex(search)}`, $options: 'i' } }];
      if (/^[a-f\d]{24}$/i.test(search)) matches.push({ _id: new mongoose.Types.ObjectId(search) });
      const items = await GroupResource.find({ ...query, $or: matches })
        .select('title description url fileType createdBy createdAt')
        .populate('createdBy', 'username')
        .sort({ _id: -1 })
        .limit(8);
      return res.json(items);
    }
    if (req.query.cursor) {
      if (!mongoose.isValidObjectId(req.query.cursor)) return res.status(400).json({ message: 'Cursor no válido' });
      query._id = { $lt: req.query.cursor };
    }
    const docs = await GroupResource.find(query)
      .select('title description url fileType createdBy createdAt')
      .populate('createdBy', 'username')
      .sort({ _id: -1 })
      .limit(PAGE_SIZE + 1);
    const hasMore = docs.length > PAGE_SIZE;
    const items = docs.slice(0, PAGE_SIZE);
    res.json({ items, nextCursor: hasMore ? String(items.at(-1)._id) : null });
  } catch (error) {
    console.error('Error getGroupResources:', error);
    res.status(500).json({ message: 'Error al obtener recursos' });
  }
};

const createResource = async (req, res) => {
  try {
    if (!(await getMemberGroup(req.params.groupId, req.user, res))) return;
    const { title, description = '', url, fileType = 'auto' } = req.body || {};
    if (!boundedText(title, 120)) return res.status(400).json({ message: 'El título es obligatorio (máx. 120 caracteres)' });
    if (typeof description !== 'string' || description.length > 500) {
      return res.status(400).json({ message: 'La descripción no puede superar 500 caracteres' });
    }
    if (typeof url !== 'string' || url.length > 2048 || !validUrl(url)) {
      return res.status(400).json({ message: 'Usá un enlace http o https válido' });
    }
    if (!['auto', 'pdf', 'document', 'image', 'link'].includes(fileType)) {
      return res.status(400).json({ message: 'Tipo de archivo no válido' });
    }
    const resource = await GroupResource.create({
      group: req.params.groupId,
      createdBy: req.user._id,
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      fileType,
    });
    await resource.populate('createdBy', 'username');
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error createGroupResource:', error);
    res.status(500).json({ message: 'Error al guardar el recurso' });
  }
};

const deleteResource = async (req, res) => {
  try {
    const group = await getMemberGroup(req.params.groupId, req.user, res);
    if (!group) return;
    const resource = await GroupResource.findOne({ _id: req.params.resourceId, group: req.params.groupId });
    if (!resource) return res.status(404).json({ message: 'Recurso no encontrado' });
    if (resource.createdBy.toString() !== req.user._id.toString() && !canModerate(group, req.user)) {
      return res.status(403).json({ message: 'Solo quien lo agregó, el creador o un administrador puede borrarlo' });
    }
    await resource.deleteOne();
    res.json({ message: 'Recurso eliminado' });
  } catch (error) {
    console.error('Error deleteGroupResource:', error);
    res.status(500).json({ message: 'Error al eliminar el recurso' });
  }
};

module.exports = {
  getPosts, createPost, deletePost,
  getComments, createComment, deleteComment,
  getResources, createResource, deleteResource,
  validUrl, attachMentions,
};
