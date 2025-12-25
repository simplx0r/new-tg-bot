import { REACTION_TYPES } from '../constants/index.js';

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

  sendReaction(bot, chatId, reaction) {
    if (!reaction) {
      return null;
    }

    if (reaction.reaction_type === REACTION_TYPES.STICKER) {
      return bot.sendSticker(chatId, reaction.reaction_content);
    } else if (reaction.reaction_type === REACTION_TYPES.MESSAGE) {
      return bot.sendMessage(chatId, reaction.reaction_content);
    }

    return null;
  }

  sendRandomReaction(bot, chatId) {
    const reaction = this.getRandomReaction();
    return this.sendReaction(bot, chatId, reaction);
  }

  findReactionByTrigger(text) {
    const allReactions = this.getAllReactions();
    return allReactions.find((r) => text.toLowerCase().includes(r.trigger_text.toLowerCase()));
  }

  sendReactionByTrigger(bot, chatId, text) {
    const reaction = this.findReactionByTrigger(text);
    if (reaction) {
      return this.sendReaction(bot, chatId, reaction);
    }
    return null;
  }
}

export default ReactionService;
