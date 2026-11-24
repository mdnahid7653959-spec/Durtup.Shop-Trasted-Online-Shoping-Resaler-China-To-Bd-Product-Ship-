/**
 * Durtup.shop Telegram Super Admin Control Center
 * Mock Telegram Bot API Interceptor & Test Assertions
 *
 * Simulates Telegram Bot API endpoints in-memory without making network calls.
 * Records all invocations, tracks timestamps, and provides comprehensive assertion methods.
 */

import { MockTelegramCall, InlineKeyboardMarkup, InlineKeyboardButton } from './types';

export class MockTelegramApi {
  public calls: MockTelegramCall[] = [];
  private messageCounter = 1000;

  /**
   * Clear all recorded calls and reset message ID counter.
   */
  public clear(): void {
    this.calls = [];
    this.messageCounter = 1000;
  }

  /**
   * Reset the mock state (alias for clear).
   */
  public reset(): void {
    this.clear();
  }

  /**
   * Record an API call and generate an authentic mock response.
   */
  public recordCall(method: 'sendMessage' | 'editMessageText' | 'answerCallbackQuery' | 'sendPhoto', payload: any): any {
    const call: MockTelegramCall = {
      method,
      payload: JSON.parse(JSON.stringify(payload)), // Deep clone to prevent accidental test mutation
      timestamp: Date.now()
    };
    this.calls.push(call);

    // Validate 64-byte callback limit on any sent keyboards
    if (payload?.reply_markup?.inline_keyboard) {
      this.validateKeyboardCallbackBytes(payload.reply_markup.inline_keyboard);
    }

    switch (method) {
      case 'sendMessage':
        this.messageCounter += 1;
        return {
          ok: true,
          result: {
            message_id: this.messageCounter,
            chat: { id: payload.chat_id, type: 'private' },
            date: Math.floor(Date.now() / 1000),
            text: payload.text,
            reply_markup: payload.reply_markup
          }
        };

      case 'editMessageText':
        return {
          ok: true,
          result: {
            message_id: payload.message_id || this.messageCounter,
            chat: { id: payload.chat_id || 0, type: 'private' },
            date: Math.floor(Date.now() / 1000),
            text: payload.text,
            reply_markup: payload.reply_markup
          }
        };

      case 'sendPhoto':
        this.messageCounter += 1;
        return {
          ok: true,
          result: {
            message_id: this.messageCounter,
            chat: { id: payload.chat_id, type: 'private' },
            date: Math.floor(Date.now() / 1000),
            photo: [{ file_id: 'mock_file_id_' + this.messageCounter, width: 800, height: 800 }],
            caption: payload.caption,
            reply_markup: payload.reply_markup
          }
        };

      case 'answerCallbackQuery':
        return {
          ok: true,
          result: true
        };

      default:
        return { ok: true, result: true };
    }
  }

  // ==========================================
  // Mock API Methods
  // ==========================================

  public async sendMessage(chatId: number | string, text: string, options: Record<string, any> = {}): Promise<any> {
    return this.recordCall('sendMessage', {
      chat_id: chatId,
      text,
      ...options
    });
  }

  public async editMessageText(text: string, options: Record<string, any> = {}): Promise<any> {
    return this.recordCall('editMessageText', {
      text,
      ...options
    });
  }

  public async answerCallbackQuery(callbackQueryId: string, options: Record<string, any> = {}): Promise<any> {
    return this.recordCall('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      ...options
    });
  }

  public async sendPhoto(chatId: number | string, photo: string, options: Record<string, any> = {}): Promise<any> {
    return this.recordCall('sendPhoto', {
      chat_id: chatId,
      photo,
      ...options
    });
  }

  // ==========================================
  // Query Helpers
  // ==========================================

  public getCalls(method?: 'sendMessage' | 'editMessageText' | 'answerCallbackQuery' | 'sendPhoto'): MockTelegramCall[] {
    if (!method) return [...this.calls];
    return this.calls.filter(c => c.method === method);
  }

  public lastCall(): MockTelegramCall | undefined {
    return this.calls[this.calls.length - 1];
  }

  public lastMessage(): any | undefined {
    const msgCalls = this.calls.filter(c => c.method === 'sendMessage');
    return msgCalls.length > 0 ? msgCalls[msgCalls.length - 1].payload : undefined;
  }

  public lastEditedMessage(): any | undefined {
    const editCalls = this.calls.filter(c => c.method === 'editMessageText');
    return editCalls.length > 0 ? editCalls[editCalls.length - 1].payload : undefined;
  }

  public lastSentOrEditedMessage(): any | undefined {
    const relevant = this.calls.filter(c => c.method === 'sendMessage' || c.method === 'editMessageText');
    return relevant.length > 0 ? relevant[relevant.length - 1].payload : undefined;
  }

  public lastAnsweredCallback(): any | undefined {
    const ansCalls = this.calls.filter(c => c.method === 'answerCallbackQuery');
    return ansCalls.length > 0 ? ansCalls[ansCalls.length - 1].payload : undefined;
  }

  public lastPhoto(): any | undefined {
    const photoCalls = this.calls.filter(c => c.method === 'sendPhoto');
    return photoCalls.length > 0 ? photoCalls[photoCalls.length - 1].payload : undefined;
  }

  // ==========================================
  // Assertions
  // ==========================================

  /**
   * Asserts that the last sent or edited message contains the expected substring.
   */
  public assertLastMessageContains(text: string): void {
    const last = this.lastSentOrEditedMessage();
    if (!last) {
      throw new Error(`[MockTelegramApi Assertion Failed] No sendMessage or editMessageText calls were recorded.`);
    }
    const messageText = last.text || last.caption || '';
    if (!messageText.includes(text)) {
      throw new Error(
        `[MockTelegramApi Assertion Failed] Expected message to contain "${text}", but received:\n${messageText}`
      );
    }
  }

  /**
   * Asserts that the last sent or edited message does NOT contain the forbidden substring.
   */
  public assertLastMessageNotContains(text: string): void {
    const last = this.lastSentOrEditedMessage();
    if (!last) return;
    const messageText = last.text || last.caption || '';
    if (messageText.includes(text)) {
      throw new Error(
        `[MockTelegramApi Assertion Failed] Expected message NOT to contain "${text}", but it was found:\n${messageText}`
      );
    }
  }

  /**
   * Asserts that the last message has an inline keyboard containing a button with a callback_data prefix.
   */
  public assertLastInlineKeyboardHasCallback(callbackPrefix: string): void {
    const last = this.lastSentOrEditedMessage();
    if (!last) {
      throw new Error(`[MockTelegramApi Assertion Failed] No message found to inspect keyboard.`);
    }

    const keyboard: InlineKeyboardButton[][] = last.reply_markup?.inline_keyboard;
    if (!keyboard || !Array.isArray(keyboard) || keyboard.length === 0) {
      throw new Error(`[MockTelegramApi Assertion Failed] Last message has no inline keyboard buttons.`);
    }

    const allButtons = keyboard.flat();
    const found = allButtons.some(b => b.callback_data && b.callback_data.startsWith(callbackPrefix));
    if (!found) {
      const callbacks = allButtons.map(b => b.callback_data).filter(Boolean);
      throw new Error(
        `[MockTelegramApi Assertion Failed] Expected inline keyboard to have callback matching "${callbackPrefix}", but found: [${callbacks.join(', ')}]`
      );
    }
  }

  /**
   * Asserts that an inline button with exact text exists in the last message's keyboard.
   */
  public assertLastInlineKeyboardHasButtonText(buttonText: string): void {
    const last = this.lastSentOrEditedMessage();
    if (!last?.reply_markup?.inline_keyboard) {
      throw new Error(`[MockTelegramApi Assertion Failed] No inline keyboard found on last message.`);
    }
    const allButtons: InlineKeyboardButton[] = last.reply_markup.inline_keyboard.flat();
    const found = allButtons.some(b => b.text.includes(buttonText));
    if (!found) {
      const texts = allButtons.map(b => b.text);
      throw new Error(
        `[MockTelegramApi Assertion Failed] Expected button with text "${buttonText}", but found: [${texts.join(', ')}]`
      );
    }
  }

  /**
   * Asserts that no callback_data across all recorded calls exceeds 64 bytes in UTF-8.
   */
  public assertNoCallbackDataExceeds64Bytes(): void {
    for (const call of this.calls) {
      const keyboard: InlineKeyboardButton[][] = call.payload?.reply_markup?.inline_keyboard;
      if (keyboard && Array.isArray(keyboard)) {
        this.validateKeyboardCallbackBytes(keyboard);
      }
    }
  }

  /**
   * Asserts that answerCallbackQuery was called, optionally matching text.
   */
  public assertAnswerCallbackQueryCalled(text?: string): void {
    const answers = this.calls.filter(c => c.method === 'answerCallbackQuery');
    if (answers.length === 0) {
      throw new Error(`[MockTelegramApi Assertion Failed] answerCallbackQuery was not called.`);
    }
    if (text !== undefined) {
      const found = answers.some(a => a.payload?.text?.includes(text));
      if (!found) {
        const receivedTexts = answers.map(a => a.payload?.text).filter(Boolean);
        throw new Error(
          `[MockTelegramApi Assertion Failed] Expected answerCallbackQuery text to contain "${text}", but got [${receivedTexts.join(', ')}]`
        );
      }
    }
  }

  /**
   * Asserts that sendPhoto was called, optionally checking photo URL or caption substring.
   */
  public assertPhotoSent(photoUrlSubstring?: string, captionSubstring?: string): void {
    const photos = this.calls.filter(c => c.method === 'sendPhoto');
    if (photos.length === 0) {
      throw new Error(`[MockTelegramApi Assertion Failed] sendPhoto was not called.`);
    }
    if (photoUrlSubstring) {
      const match = photos.some(p => String(p.payload?.photo || '').includes(photoUrlSubstring));
      if (!match) {
        const receivedUrls = photos.map(p => p.payload?.photo);
        throw new Error(
          `[MockTelegramApi Assertion Failed] Expected photo matching "${photoUrlSubstring}", but got [${receivedUrls.join(', ')}]`
        );
      }
    }
    if (captionSubstring) {
      const matchCaption = photos.some(p => String(p.payload?.caption || '').includes(captionSubstring));
      if (!matchCaption) {
        const captions = photos.map(p => p.payload?.caption);
        throw new Error(
          `[MockTelegramApi Assertion Failed] Expected photo caption matching "${captionSubstring}", but got [${captions.join(', ')}]`
        );
      }
    }
  }

  /**
   * Asserts exact number of calls for a specific method or in total.
   */
  public assertCallCount(method: 'sendMessage' | 'editMessageText' | 'answerCallbackQuery' | 'sendPhoto' | 'any', expected: number): void {
    const actual = method === 'any' ? this.calls.length : this.calls.filter(c => c.method === method).length;
    if (actual !== expected) {
      throw new Error(
        `[MockTelegramApi Assertion Failed] Expected ${expected} calls for "${method}", but received ${actual}.`
      );
    }
  }

  // ==========================================
  // Internal Validators
  // ==========================================

  private validateKeyboardCallbackBytes(keyboard: InlineKeyboardButton[][]): void {
    for (const row of keyboard) {
      if (!Array.isArray(row)) continue;
      for (const btn of row) {
        if (btn?.callback_data) {
          const byteLength = Buffer.byteLength(btn.callback_data, 'utf8');
          if (byteLength > 64) {
            throw new Error(
              `[Telegram API Constraint Violation] callback_data exceeds 64 bytes (${byteLength} bytes): "${btn.callback_data}"`
            );
          }
        }
      }
    }
  }
}
