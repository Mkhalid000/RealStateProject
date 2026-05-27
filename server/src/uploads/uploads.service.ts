import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import ImageKit from 'imagekit';

@Injectable()
export class UploadsService {
  private ik: ImageKit;

  constructor(private config: ConfigService) {
    this.ik = new ImageKit({
      publicKey: this.config.get<string>('IMAGEKIT_PUBLIC_KEY') ?? '',
      privateKey: this.config.get<string>('IMAGEKIT_PRIVATE_KEY') ?? '',
      urlEndpoint: this.config.get<string>('IMAGEKIT_URL_ENDPOINT') ?? '',
    });
  }

  /**
   * Returns ImageKit client-upload auth params. The client uploads the file
   * DIRECTLY to ImageKit (no media passes through our server) using these:
   *   token, expire, signature  — generated server-side with the private key
   *   publicKey, urlEndpoint     — needed by the client upload call
   */
  signUpload() {
    const auth = this.ik.getAuthenticationParameters();
    return {
      ...auth,
      publicKey: this.config.get<string>('IMAGEKIT_PUBLIC_KEY'),
      urlEndpoint: this.config.get<string>('IMAGEKIT_URL_ENDPOINT'),
    };
  }
}
