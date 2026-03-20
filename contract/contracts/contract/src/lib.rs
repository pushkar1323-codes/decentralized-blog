#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Post {
    pub id: u64,
    pub title: String,
    pub content: String,
    pub author: Address,
    pub comment_count: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Comment {
    pub id: u64,
    pub content: String,
    pub author: Address,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Posts,
    Comments(u64),
    PostCounter,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn create_post(env: Env, author: Address, title: String, content: String) -> u64 {
        let counter_key = DataKey::PostCounter;
        let post_id: u64 = env.storage().instance().get(&counter_key).unwrap_or(0) + 1;
        env.storage().instance().set(&counter_key, &post_id);

        let post = Post {
            id: post_id,
            title,
            content,
            author,
            comment_count: 0,
            timestamp: env.ledger().timestamp(),
        };

        let mut posts: Map<u64, Post> = env
            .storage()
            .instance()
            .get(&DataKey::Posts)
            .unwrap_or_else(|| Map::new(&env));
        posts.set(post_id, post.clone());
        env.storage().instance().set(&DataKey::Posts, &posts);

        post_id
    }

    pub fn get_post(env: Env, post_id: u64) -> Post {
        let posts: Map<u64, Post> = env.storage().instance().get(&DataKey::Posts).unwrap();
        posts.get(post_id).unwrap()
    }

    pub fn add_comment(env: Env, post_id: u64, author: Address, content: String) -> u64 {
        let posts: Map<u64, Post> = env.storage().instance().get(&DataKey::Posts).unwrap();
        let post = posts.get(post_id).unwrap();

        let mut comments: Vec<Comment> = env
            .storage()
            .instance()
            .get(&DataKey::Comments(post_id))
            .unwrap_or_else(|| Vec::new(&env));

        let comment_id = comments.len() as u64 + 1;
        let comment = Comment {
            id: comment_id,
            content,
            author,
            timestamp: env.ledger().timestamp(),
        };
        comments.push_back(comment);

        env.storage()
            .instance()
            .set(&DataKey::Comments(post_id), &comments);

        let mut posts = posts;
        let mut updated_post = post.clone();
        updated_post.comment_count += 1;
        posts.set(post_id, updated_post);
        env.storage().instance().set(&DataKey::Posts, &posts);

        comment_id
    }

    pub fn get_comments(env: Env, post_id: u64) -> Vec<Comment> {
        env.storage()
            .instance()
            .get(&DataKey::Comments(post_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_all_posts(env: Env) -> Vec<Post> {
        let posts: Map<u64, Post> = env
            .storage()
            .instance()
            .get(&DataKey::Posts)
            .unwrap_or_else(|| Map::new(&env));

        let mut result = Vec::new(&env);
        let keys = posts.keys();
        for i in 0..keys.len() {
            let key = keys.get(i).unwrap();
            result.push_back(posts.get(key).unwrap());
        }
        result
    }
}

mod test;
