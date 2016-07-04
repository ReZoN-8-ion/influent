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

package influent.server.clustering.utils;

import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Ehcache;
import net.sf.ehcache.Element;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ClusterContextCache {
	
	private static final Logger s_logger = LoggerFactory.getLogger(ClusterContextCache.class);

	/**
	 * A set of permits to contexts, which MUST be released after use.
	 * 
	 * @author djonker
	 */
	public static class PermitSet {
		private List<Permit> permits;

		public PermitSet() {
			permits = new LinkedList<ClusterContextCache.Permit>();
		}
		
		/**
		 * Release all permits
		 */
		public void revoke() {
			for (Permit permit : permits) {
				permit.revoke();
			}
			
			permits.clear();
		}
		
		/**
		 * Release the specified permit and remove it from this set.
		 */
		public void revoke(String contextId) {
			Iterator<Permit> i = permits.iterator();

			while (i.hasNext()) {
				Permit permit = i.next();
				
				if (permit.id().equals(contextId)) {
					permit.revoke();
					i.remove();
				}
			}
		}

		// add a new permit
		private Permit add(Permit permit) {
			permits.add(permit);
			
			return permit;
		}
		
	}
	
	/**
	 * Returns a permit to a context, which MUST be released after use.
	 * 
	 * @author djonker
	 */
	private interface Permit {
		/**
		 * context id
		 */
		public String id();
		
		/**
		 * The context which we have a permit to
		 */
		public ColumnContext context();

		/**
		 * Must call release when done with context
		 */
		public void revoke();
	}

	
	/**
	 * Lock management for a single context.
	 * @author djonker
	 */
	private static class LockableContext {
		private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
		private final Lock read = lock.readLock();
		private final Lock write = lock.writeLock();
		private final ConcurrentLinkedQueue<ReadPermit> reads = 
				new ConcurrentLinkedQueue<ClusterContextCache.ReadPermit>();
		
		ColumnContext writableContext;
		
		
		
		private void unlockRead(int readCount) {
			while (readCount-- > 0) {
				read.unlock();
			}
		}
		
		
		
		
		private void lockRead(int readCount, String contextId) {
			while (readCount-- > 0) {
				try {
					read.lock();
					
				} catch (Exception e) {
					s_logger.warn("Problem reinstating read lock in write " + contextId);
				}
			}
		}
		
	}
	
	
	
	private final Ehcache cache;
	private Map<String, LockableContext> lockables;
	private static int LOCK_TIMEOUT = /*30*/60*1000;
	
	
	
	/**
	 * A permit holds a context lock within the execution of one client thread.
	 * 
	 * @author djonker
	 */
	private class ReadPermit implements Permit {
		final String contextId;
		ColumnContext context;
		LockableContext lockable;
		
		
		
		
		/**
		 * Retrieve the associated context
		 */
		public ColumnContext context() {
			return context;
		}

		
		
		
		/**
		 * Release all permits
		 */
		public void revoke() {
			if (lockable != null) {
				lockable.reads.remove(this);
				
				final LockableContext lc = lockable;
				lockable = null;
				
				// unlock
				lc.read.unlock();
			}
		}
		
		
		
		
		// construct
		private ReadPermit(String contextId) {
			this.contextId = contextId;
			
			lockable = lockables.get(contextId);
			
			try {
				if (lockable != null) {
					
					if (lockable.read.tryLock(LOCK_TIMEOUT, TimeUnit.MILLISECONDS)) {
						lockable.reads.add(this);
						
						// look first for a write copy in progress.
						context = lockable.writableContext;
					
						// otherwise grab from the cache.
						if (context == null) {
							Element element = cache.get(contextId);
							
							if (element != null) {
								context = (ColumnContext)element.getObjectValue();
							}
						}
					} else {
						lockable = null;
						s_logger.error("Timed out waiting for context read lock " + contextId);
					}
					
				} else {
					s_logger.warn("Asked for non-existent context " + contextId);
					// else don't lock anything. it doesn't exist so can't read it.
				}
				
			} catch (InterruptedException e) {
				s_logger.error("Interrupted waiting for context read lock " + contextId);
			}
		}

		
		
		
		/**
		 * Get the context again.
		 */
		private void refresh(ColumnContext c) {
			context = c;
		}
		

		
		
		/* (non-Javadoc)
		 * @see java.lang.Object#finalize()
		 */
		@Override
		protected void finalize() throws Throwable {
			
			// can't release from finalizer thread to resolve, so just log the issue.
			if (lockable != null) {
				s_logger.error("Read permit was not released and has gone out of scope!!! "+ contextId);
			}
			
			super.finalize();
		}

		
		
		
		@Override
		public String id() {
			return contextId;
		}

	}
	
	
	
	
	/**
	 * A permit holds a context lock within the execution of one client thread.
	 * 
	 * @author djonker
	 */
	private class WritePermit implements Permit {
		String contextId;
		ColumnContext context;
		LockableContext lockable;
		
		
		
		/**
		 * Retrieve the associated context
		 */
		public ColumnContext context() {
			return context;
		}
		
		
		
		
		/**
		 * Release all permits
		 */
		public void revoke() {
			if (lockable != null) {
				final LockableContext lc = lockable;
				lockable = null;

				try {
					// last reentrant write lock?
					if (lc.lock.getWriteHoldCount() == 1) {
						// clear this local reference
						lc.writableContext = null;

						// make sure the read permits have the latest now.
						for (ReadPermit permit : lc.reads) {
							permit.refresh(context);
						}
						
						// and return the context to the cache.
						cache.put(new Element(contextId, context));
					}
				} finally {
					lc.write.unlock();
				}
			}
		}
		
		
		
		
		// construct
		private WritePermit(String contextId) {
			this.contextId = contextId;
			
			lockable = lockables.get(contextId);
			
			
			try {
				if (lockable != null) {
					
					// how many read locks we have.
					int readCount = lockable.lock.getReadHoldCount();
					
					try {
						// we have to release all read locks from this thread and reinstate them later
						lockable.unlockRead(readCount);
						
					} catch (Exception e) {
						lockable = null;
						s_logger.warn("Problem giving up read lock for write " + contextId);
						return;
					}

					if (lockable.write.tryLock(
							LOCK_TIMEOUT, 
							TimeUnit.MILLISECONDS
						)
					) {
						context = lockable.writableContext;

						lockable.lockRead(readCount, contextId);
						
					} else {
						lockable.lockRead(readCount, contextId);
						lockable = null;
						
						s_logger.error("Timed out waiting for context write lock " + contextId);
						return;
					}
				} else {
					lockable = new LockableContext();
					try {
						lockables.put(contextId, lockable);
						lockable.write.lock();
					} catch (Exception e) {
						lockable = null;
						s_logger.error("Unexpected exception creating new context write lock " + contextId);
						
						return;
					}
				}

				// reentrant write doesn't already exist?
				if (context == null) {
					
					// take the element for editing out of the cache.
					Element element = cache.get(contextId);
					
					if (element != null) {
						context = (ColumnContext)element.getObjectValue();
						cache.remove(contextId);
					}
				}
				
				if (context == null) {
					try {
						context = new ColumnContext(contextId);
						
					} catch (Exception e) {
						lockable = null;
						s_logger.error("Unexpected exception creating new context " + contextId);
						
						return;
					}
				}
				
				// store the reference to the edit-in-progress element here.
				lockable.writableContext = context;
				
			} catch (InterruptedException e) {
				s_logger.error("Interrupted waiting for context write lock " + contextId);
			}
		}

		
		
		
		/* (non-Javadoc)
		 * @see java.lang.Object#finalize()
		 */
		@Override
		protected void finalize() throws Throwable {
			
			// can't release from finalizer thread to resolve, so just log the issue.
			if (lockable != null) {
				s_logger.error("Write permit was not released and has gone out of scope!!! "+ contextId);
			}
			
			super.finalize();
		}

		
		
		
		@Override
		public String id() {
			return contextId;
		}
	}
	
	
	
	
	/**
	 * (self construct).
	 */
	public ClusterContextCache(
		String ehCacheConfig,
		String cacheName
	) {		
		CacheManager cacheManager = (ehCacheConfig != null) ? CacheManager.create(ehCacheConfig) : null;
		if (cacheManager == null) {
			throw new RuntimeException("Failed to initialize ehcache with specified config");
		}
		
		cache = cacheManager.getEhcache(cacheName);
		lockables = new ConcurrentHashMap<String, LockableContext>();
	}

	
	
	
	/**
	 * Fetch a context for ready only access. Permit will be added to permit set. PERMITS MUST BE RELEASED.
	 */
	public ContextRead getReadOnly(String contextId, PermitSet permits) {
		return permits.add(new ReadPermit(contextId)).context();
	}
	
	
	
	
	/**
	 * Fetch a read write context permit. PERMITS MUST BE RELEASED.
	 */
	public ContextReadWrite getReadWrite(String contextId, PermitSet permits) {
		return permits.add(new WritePermit(contextId)).context();
	}

	
	
	
	/**
	 * Remove a context
	 */
	public boolean remove(String contextId) {
		boolean success = false;
		
		try {
			final LockableContext lockable = lockables.get(contextId);
			
			if (lockable != null) {
				try {
					if (lockable.write.tryLock(LOCK_TIMEOUT, TimeUnit.MILLISECONDS)) {
						success = cache.remove(contextId);
						
						lockable.write.unlock();
						
					} else {
						s_logger.error("Timed out waiting for context write lock to remove. " + contextId);
					}
					
				} finally {
					lockables.remove(contextId);
				}
				
			} else {
				s_logger.warn("Tried to remove a context which doesn't exist. " + contextId);
			}
			
		} catch (InterruptedException e) {
			s_logger.error("Timed out waiting for context write lock to remove. "+ contextId);
		}
		
		return success;
	}
}
