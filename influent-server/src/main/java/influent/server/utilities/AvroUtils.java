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
package influent.server.utilities;

import java.io.ByteArrayOutputStream;

import org.apache.avro.Schema;
import org.apache.avro.io.DatumReader;
import org.apache.avro.io.DatumWriter;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.io.JsonDecoder;
import org.apache.avro.io.JsonEncoder;
import org.apache.avro.specific.SpecificDatumReader;
import org.apache.avro.specific.SpecificDatumWriter;
import org.apache.avro.specific.SpecificRecord;
import org.apache.avro.specific.SpecificRecordBase;

public class AvroUtils {
    /**
     * Encodes an Avro object as JSON string.
     * 
     * Note: Just calling record.toString() doesn't encode union types losslessly (since it leaves out their type).
     */
    public static String encodeJSON(SpecificRecordBase record) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream(); 
        JsonEncoder encoder = EncoderFactory.get().jsonEncoder(record.getSchema(), baos);
        DatumWriter<SpecificRecord> datumWriter = new SpecificDatumWriter<SpecificRecord>(record.getSchema());
        datumWriter.write(record, encoder);
        encoder.flush();
        return baos.toString();
    }
    
    /**
     * Decodes an Avro object from a JSON string.
     * 
     * Note: This method will fail on strings created by calling record.toString() since that doesn't encode union types losslessly.
     */
    public static SpecificRecord decodeJSON(Schema schema, String json) throws Exception {
        DatumReader<SpecificRecord> datumReader = new SpecificDatumReader<SpecificRecord>(schema);
        JsonDecoder decoder = DecoderFactory.get().jsonDecoder(schema, json);
        SpecificRecord record = datumReader.read(null, decoder);
        return record;
    }
}
