import { REACTION_TYPES } from '../constants/index.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

class ReactionService {
  constructor(reactionRepository) {
    this.reactionRepository = reactionRepository;
  }

  addReaction(triggerText, reactionType, reactionContent, category = 'general') {
    return this.reactionRepository.addReaction(triggerText, reactionType, reactionContent, category);
  }

  getAllReactions() {
    return this.reactionRepository.getAllReactions();
  }

  getReactionsByCategory(category) {
    return this.reactionRepository.getReactionsByCategory(category);
  }

  getRandomReaction() {
    return this.reactionRepository.getRandomReaction();
  }

  sendReaction(bot, chatId, reaction, options = {}) {
    if (!reaction) {
      return null;
    }

    if (reaction.reaction_type === REACTION_TYPES.STICKER) {
      return bot.sendSticker(chatId, reaction.reaction_content, options);
    } else if (reaction.reaction_type === REACTION_TYPES.MESSAGE) {
      return safeSendMessage(bot, chatId, reaction.reaction_content, options);
    }

    return null;
  }

  sendRandomReaction(bot, chatId, options = {}) {
    const reaction = this.getRandomReaction();
    return this.sendReaction(bot, chatId, reaction, options);
  }

  findReactionByTrigger(text) {
    const allReactions = this.getAllReactions();
    return allReactions.find((r) => text.toLowerCase().includes(r.trigger_text.toLowerCase()));
  }

  sendReactionByTrigger(bot, chatId, text, options = {}) {
    const reaction = this.findReactionByTrigger(text);
    if (reaction) {
      return this.sendReaction(bot, chatId, reaction, options);
    }
    return null;
  }
}

export default ReactionService;
