/*
 * Copyright 2013-2016 Uncharted Software Inc.
 *
 *  Property of Uncharted(TM), formerly Oculus Info Inc.
 *  https://uncharted.software/
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package influent.server.data;

import java.awt.image.RenderedImage;
import java.io.IOException;
import java.io.OutputStream;

import javax.imageio.ImageIO;

import org.restlet.data.MediaType;
import org.restlet.representation.OutputRepresentation;


public class ImageRepresentation extends OutputRepresentation {
	
	private RenderedImage image;


	public ImageRepresentation(RenderedImage image) {
		super(MediaType.IMAGE_PNG);
		this.image= image;
	}

	/* (non-Javadoc)
	 * @see org.restlet.representation.Representation#write(java.io.OutputStream)
	 */
	@Override
	public void write(OutputStream outputStream) throws IOException {
		ImageIO.write( image, "png", outputStream );
	}
}
