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

package influent.midtier.kiva.data;

public class KivaID {
	public final EntityType type;
	public final String id;
//	final String loan;
	
	public KivaID(EntityType type, String id) {
		this.type = type;
		
//		/** PARTNER HACK **/
//		String loan = null;
//		if (type==EntityType.Partner && id.indexOf("-") > -1) {
//			id = id.substring(0, id.indexOf("-"));
//			loan = id.substring(id.indexOf("-")+1);
//		}
		this.id = id;
//		this.loan = loan;
	}
	
	public enum EntityType {
		Borrowers ("B", "b"),
		Team ("T", null),
		Partner ("P", "p"),
		Lender ("L", "l");
		
		String character;
		String financialId;
		EntityType(String character, String idColumnName) { this.character = character; this.financialId = idColumnName; }
		
		static EntityType parse(String character) {
			for (EntityType type : EntityType.values()) {
				if (type.character.equalsIgnoreCase(character)) return type;
			}
			return null;
		}
		public static EntityType parseFinancialId(String financialId) {
			for (EntityType type : EntityType.values()) {
				if (type.financialId != null && type.financialId.equals(financialId)) return type;
			}
			return null;
		}

		public String createID(String id) { return character + id; }
		public String financialId() {
			if (financialId == null) throw new UnsupportedOperationException();
			return financialId;
		}
		
	}
	
	public static boolean isKiva(String id) {
		if (id.startsWith("b")) return true;
		if (id.startsWith("l")) return true;
		if (id.startsWith("p")) return true;
		return false;
	}
	
	public static KivaID parse(String id) {
		if (isKiva(id)) {
			return new KivaID(EntityType.parse(id.substring(0, 1)), id.substring(1));
		}
		return null;
	}
	
	@Override
	public String toString() {
		return id;
	}
}
