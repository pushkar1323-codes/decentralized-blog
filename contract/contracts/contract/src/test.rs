#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_and_get_post() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let author = Address::generate(&env);
    let post_id = client.create_post(
        &author,
        &String::from_str(&env, "Hello Blockchain"),
        &String::from_str(&env, "This is my first decentralized blog post!"),
    );

    assert_eq!(post_id, 1);

    let post = client.get_post(&post_id);
    assert_eq!(post.title, String::from_str(&env, "Hello Blockchain"));
    assert_eq!(
        post.content,
        String::from_str(&env, "This is my first decentralized blog post!")
    );
    assert_eq!(post.author, author);
    assert_eq!(post.comment_count, 0);
}

#[test]
fn test_add_comment() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let author = Address::generate(&env);
    let commenter = Address::generate(&env);

    let post_id = client.create_post(
        &author,
        &String::from_str(&env, "Test Post"),
        &String::from_str(&env, "Content here"),
    );

    let comment_id =
        client.add_comment(&post_id, &commenter, &String::from_str(&env, "Great post!"));

    assert_eq!(comment_id, 1);

    let post = client.get_post(&post_id);
    assert_eq!(post.comment_count, 1);

    let comments = client.get_comments(&post_id);
    assert_eq!(comments.len(), 1);
    assert_eq!(
        comments.get(0).unwrap().content,
        String::from_str(&env, "Great post!")
    );
}

#[test]
fn test_permissionless_posts() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    // Multiple different users can all create posts without permission
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    let post1 = client.create_post(
        &user1,
        &String::from_str(&env, "Post by User 1"),
        &String::from_str(&env, "Content from user 1"),
    );
    assert_eq!(post1, 1);

    let post2 = client.create_post(
        &user2,
        &String::from_str(&env, "Post by User 2"),
        &String::from_str(&env, "Content from user 2"),
    );
    assert_eq!(post2, 2);

    let post3 = client.create_post(
        &user3,
        &String::from_str(&env, "Post by User 3"),
        &String::from_str(&env, "Content from user 3"),
    );
    assert_eq!(post3, 3);

    // Get all posts
    let all_posts = client.get_all_posts();
    assert_eq!(all_posts.len(), 3);
}

#[test]
fn test_permissionless_comments() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let post_author = Address::generate(&env);
    let post_id = client.create_post(
        &post_author,
        &String::from_str(&env, "Discussion Post"),
        &String::from_str(&env, "Let's discuss!"),
    );

    // Multiple different users can all comment without permission
    let commenter1 = Address::generate(&env);
    let commenter2 = Address::generate(&env);
    let commenter3 = Address::generate(&env);

    client.add_comment(
        &post_id,
        &commenter1,
        &String::from_str(&env, "First comment!"),
    );
    client.add_comment(
        &post_id,
        &commenter2,
        &String::from_str(&env, "Second comment!"),
    );
    client.add_comment(
        &post_id,
        &commenter3,
        &String::from_str(&env, "Third comment!"),
    );

    let post = client.get_post(&post_id);
    assert_eq!(post.comment_count, 3);

    let comments = client.get_comments(&post_id);
    assert_eq!(comments.len(), 3);
}

#[test]
fn test_get_all_posts_empty() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let posts = client.get_all_posts();
    assert_eq!(posts.len(), 0);
}

#[test]
fn test_get_comments_empty() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let author = Address::generate(&env);
    let post_id = client.create_post(
        &author,
        &String::from_str(&env, "No Comments Post"),
        &String::from_str(&env, "Yet..."),
    );

    let comments = client.get_comments(&post_id);
    assert_eq!(comments.len(), 0);
}

#[test]
fn test_multiple_posts_with_comments() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let author = Address::generate(&env);

    let post1 = client.create_post(
        &author,
        &String::from_str(&env, "First Post"),
        &String::from_str(&env, "Content 1"),
    );
    let post2 = client.create_post(
        &author,
        &String::from_str(&env, "Second Post"),
        &String::from_str(&env, "Content 2"),
    );

    // Add comments to post 1
    let commenter = Address::generate(&env);
    client.add_comment(
        &post1,
        &commenter,
        &String::from_str(&env, "Comment on post 1"),
    );

    // Add comments to post 2
    client.add_comment(
        &post2,
        &commenter,
        &String::from_str(&env, "Comment on post 2"),
    );

    let post1_comments = client.get_comments(&post1);
    let post2_comments = client.get_comments(&post2);

    assert_eq!(post1_comments.len(), 1);
    assert_eq!(post2_comments.len(), 1);
    assert_eq!(
        post1_comments.get(0).unwrap().content,
        String::from_str(&env, "Comment on post 1")
    );
    assert_eq!(
        post2_comments.get(0).unwrap().content,
        String::from_str(&env, "Comment on post 2")
    );
}
