import axios from 'axios';

export default class WhatsAppService {
  constructor() {
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.instagram.com/${this.apiVersion}`;
  }

  /**
   * Valida que el access token sea válido
   */
  async validateAccessToken(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: { access_token: accessToken },
        timeout: 5000
      });
      return { valid: !!response.data?.id };
    } catch (error) {
      console.error('❌ WhatsAppService.validateAccessToken:', error.message);
      return { valid: false, error: 'Token inválido o expirado' };
    }
  }

  /**
   * Envía un mensaje de WhatsApp
   */
  async sendMessage(phoneNumberId, accessToken, phoneNumber, message) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber.replace(/\D/g, ''),
          type: 'text',
          text: { body: message }
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
        data: response.data
      };
    } catch (error) {
      console.error('❌ WhatsAppService.sendMessage:', error.message);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Obtiene el estado de un mensaje
   */
  async getMessageStatus(messageId, accessToken) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${messageId}`,
        {
          params: { access_token: accessToken },
          timeout: 5000
        }
      );

      return {
        success: true,
        status: response.data?.status,
        data: response.data
      };
    } catch (error) {
      console.error('❌ WhatsAppService.getMessageStatus:', error.message);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Obtiene la información del número de teléfono
   */
  async getPhoneNumberInfo(phoneNumberId, accessToken) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${phoneNumberId}`,
        {
          params: {
            fields: 'display_phone_number,verified_name,quality_rating',
            access_token: accessToken
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        phoneNumber: response.data?.display_phone_number,
        verifiedName: response.data?.verified_name,
        qualityRating: response.data?.quality_rating,
        data: response.data
      };
    } catch (error) {
      console.error('❌ WhatsAppService.getPhoneNumberInfo:', error.message);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Maneja errores de WhatsApp API
   */
  handleError(error) {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code;
    const errorMessage = error.response?.data?.error?.message;

    if (status === 400) {
      return 'Solicitud inválida. Verifica los datos enviados.';
    }
    if (status === 401) {
      return 'Access token inválido o expirado.';
    }
    if (status === 403) {
      return 'Permiso denegado. Verifica los permisos del token.';
    }
    if (status === 429) {
      return 'Límite de tasa alcanzado. Intenta más tarde.';
    }
    if (status === 500) {
      return 'Error en el servidor de WhatsApp. Intenta más tarde.';
    }

    return errorMessage || 'Error desconocido en WhatsApp API';
  }

  /**
   * Formatea un número de teléfono para WhatsApp
   */
  formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `1${cleaned}`; // Asume US si 10 dígitos
    }
    return cleaned;
  }
}
