const mongo = require('../infrastructure/mongo')
const logger = require('../infrastructure/logger')
const commentValidation = require('../validations/commentValidation')
const uuid = require('node-uuid')
const moment = require('moment')
const userService = require('./userService')

const insertComment = async (staffId, comment, ctx) => {
    const validation = await commentValidation.validate(comment, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.warning('Comment model validation failed, aborting', { url: ctx.url, comment, validation, staffId })

        return {
            ok: false,
            errors: validation.errors
        }
    }

    const user = await userService.getUser(ctx)
    const userName = await userService.getUserName(ctx, user)
    const userRoles = await userService.getUserRoles(ctx, user)

    comment.id = uuid.v1()
    comment.created = moment()._d
    comment.createdBy = userName
    comment.group = userRoles.join(', ')

    try {
        const updateOne = await mongo.collection('staffs').updateOne({ id: staffId }, { $push: { comments: comment } })

        logger.info('Insert comment result', {
            staffId,
            comment,
            result: updateOne.result
        })

        if (updateOne.result.ok === 1) {
            return {
                ok: true,
                comment: comment
            }
        }
    } catch (err) {
        logger.error('Error inserting comment', err, { staffId, commentId, url: ctx.url })
    }

    return {
        ok: false
    }
}

const deleteComment = async (staffId, commentId, ctx) => {
    try {
        const updateOne = (await mongo.collection('staffs').updateOne({ id: staffId }, { $pull: { comments: { id: commentId } } })).result

        logger.info('Delete comment result', { staffId, commentId, updateOne, url: ctx.url })

        if (updateOne.ok === 1) {
            return {
                ok: true
            }
        }
    } catch (err) {
        logger.error('Error deleting comment', err, { staffId, commentId, url: ctx.url })
    }

    return {
        ok: false
    }
}

module.exports = {
    insertComment,
    deleteComment
}
