const mongo = require('../infrastructure/mongo')
const logger = require('../infrastructure/logger')
const commentValidation = require('../validations/commentValidation')
const uuid = require('node-uuid')
const moment = require('moment')
const userService = require('./userService')

const insertComment = async (staffId, comment, ctx) => {
    const user = await userService.getUser(ctx)

    const validation = await commentValidation.validate(comment, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.warning('Comment model validation failed, aborting', { url: ctx.url, comment, validation, staffId, user })

        return {
            ok: false,
            errors: validation.errors
        }
    }

    comment.id = uuid.v1()
    comment.created = moment()._d
    comment.createdBy = user.name
    comment.group = user.roles.join(', ')

    try {
        const updateOne = await mongo.collection('staffs').updateOne({ id: staffId }, { $push: { comments: comment } })

        logger.info('Insert comment result', {
            staffId,
            comment,
            result: updateOne.result,
            user
        })

        if (updateOne.result.ok === 1) {
            return {
                ok: true,
                comment: comment
            }
        }
    } catch (err) {
        logger.error('Error inserting comment', err, { staffId, commentId, url: ctx.url, user })
    }

    return {
        ok: false
    }
}

const deleteComment = async (staffId, commentId, ctx) => {
    const user = await userService.getUser(ctx)

    try {
        const updateOne = (await mongo.collection('staffs').updateOne({ id: staffId }, { $pull: { comments: { id: commentId } } })).result

        logger.info('Delete comment result', { staffId, commentId, updateOne, url: ctx.url, user })

        if (updateOne.ok === 1) {
            return {
                ok: true
            }
        }
    } catch (err) {
        logger.error('Error deleting comment', err, { staffId, commentId, url: ctx.url, user })
    }

    return {
        ok: false
    }
}

module.exports = {
    insertComment,
    deleteComment
}
