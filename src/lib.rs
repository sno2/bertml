mod allocators;
mod conversation;
mod ner;
mod pos_tagging;
mod qa;
mod sentiment;
mod translation;
mod zero_shot_classification;

pub use zero_shot_classification::*;
pub use allocators::*;
pub use conversation::*;
pub use ner::*;
use once_cell::sync::Lazy;
pub use pos_tagging::*;
pub use qa::*;
pub use sentiment::*;
use std::sync::Mutex;
pub use translation::*;

pub static LAST_ERROR: Lazy<Mutex<Vec<u8>>> = Lazy::new(|| Mutex::new(Vec::new()));
pub static LAST_RESULT: Lazy<Mutex<Vec<u8>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[inline(always)]
pub fn set_result(v: Vec<u8>) -> usize {
    let len = v.len();
    *LAST_RESULT.lock().unwrap() = v;
    len
}

/// Inspired by deno_sqlite3's `exec` helper by @littledivvy
pub fn exec<F>(f: F) -> isize
where
   F: FnOnce() -> Result<isize, anyhow::Error>,
{
    match f() {
        Ok(a) => a,
        Err(e) => {
            let e = e.to_string().into_bytes();
            *LAST_ERROR.lock().unwrap() = e;
            -1
        }
    }
}

#[no_mangle]
extern "C" fn fill_result(buf: *mut u8, buf_len: usize) {
    let buf = unsafe { std::slice::from_raw_parts_mut(buf, buf_len) };
    buf.swap_with_slice(&mut *LAST_RESULT.lock().unwrap())
}

#[no_mangle]
extern "C" fn error_len() -> usize {
    LAST_ERROR.lock().unwrap().len()
}

#[no_mangle]
extern "C" fn fill_error(buf: *mut u8, buf_len: usize) {
    let buf = unsafe { std::slice::from_raw_parts_mut(buf, buf_len) };
    buf.swap_with_slice(&mut *LAST_ERROR.lock().unwrap());
}

#[no_mangle]
extern "C" fn delete_model(rid: usize) -> i32 {
    match models::deallocate(rid) {
        Ok(_) => 0,
        Err(_) => -1,
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
