document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#trashed').addEventListener('click', () => load_mailbox('trash'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('nothing'));

  // Set the number of emails on the trash box
  fetch('/emails/trash')
  .then(response => response.json())
  .then(trashed_emails => {
    if (trashed_emails.length === 0) {
      document.querySelector('#n_trash').innerHTML = '';
    } else {
      document.querySelector('#n_trash').innerHTML = trashed_emails.length;
    }    
  });

  // Set the number of emails on the archive box
  fetch('/emails/archive')
  .then(response => response.json())
  .then(archived_emails => {
    if (archived_emails.length === 0) {
      document.querySelector('#n_archive').innerHTML = '';
    } else {
      document.querySelector('#n_archive').innerHTML = archived_emails.length;
    }    
  });

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email(email_id) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';

  if (email_id === 'nothing') {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  } else {
    // Pre-fill composition fields with the data from email_id to make a reply
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    });
  }
  
  document.querySelector('form').onsubmit = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    load_mailbox('sent');
    return false;
  }
}


function archive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true,
        recycled: false
    })
  })
  document.location.reload();
}


function unarchive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
  document.location.reload();
}


function trash(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        recycled: true
    })
  })
  document.location.reload();
}


function untrash(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        recycled: false
    })
  })
  document.location.reload();
}


function delete_email_yes() {
  const email_id = document.querySelector('#email_id_for_del').value;
  console.log(`clicked yes for email-${email_id}`);
  fetch(`/emails/${email_id}`, {
    method: 'DEL'
  })

  // Update the number of trashed emails
  var n_trash = document.querySelector('#n_trash').innerHTML;
  document.querySelector('#n_trash').innerHTML = n_trash - 1;
  document.querySelector('#are_you_sure').style.display = 'none';
  document.querySelectorAll(".card").forEach(e => e.remove());
  load_mailbox('trash');
}
function delete_email_no() {
  const email_id = document.querySelector('#email_id_for_del').value;
  console.log(`clicked no for email-${email_id}`);
  document.querySelector('#are_you_sure').style.display = 'none';
  document.querySelectorAll(".card").forEach(e => e.remove());
  load_mailbox('trash');
}


function show_delete_email(email_id) {
  document.querySelector('#are_you_sure').style.display = 'block';
  document.querySelector('#email_id_for_del').value = email_id;
}


function view_email(email_id, mailbox) {
  // Show the view email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';

  // Clear the page
  document.querySelectorAll(".show_email").forEach(e => e.remove());

  // Show all important data
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      const view = document.createElement('div');
      view.className = 'show_email';
      view.id = `${email.id}`;
      if (mailbox === 'inbox'){

        if (email.read === false) {
          // Turn the email from non read into read
          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
          })

          // Update the little number of non read emails on the inbox button
          var n_inbox = document.querySelector('#n_inbox').innerHTML;
          n_inbox--;
          if (n_inbox === 0) {
            document.querySelector('#n_inbox').innerHTML = "";
          } else {
            document.querySelector('#n_inbox').innerHTML = n_inbox
          }
        }        
        view.innerHTML = `<p><b>From:</b> ${email.sender}</p><p><b>To:</b> ${email.recipients}</p><p><b>Subject:</b> ${email.subject}</p><p><b>On:</b> ${email.timestamp}</p><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='reply' onclick='compose_email(${email.id})'>Repply</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='archive' onclick='archive(${email.id})'>Archive</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='trash' onclick='trash(${email.id})'>Trash</button><hr><p>${email.body}</p>`;
      } else if (mailbox === 'sent') {
        view.innerHTML = `<p><b>From:</b> ${email.sender}</p><p><b>To:</b> ${email.recipients}</p><p><b>Subject:</b> ${email.subject}</p><p><b>On:</b> ${email.timestamp}</p><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='reply' onclick='compose_email(${email.id})'>Repply</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='trash' onclick='trash(${email.id})'>Trash</button><hr><p>${email.body}</p>`;
      } else if (mailbox === 'archive') {
        view.innerHTML = `<p><b>From:</b> ${email.sender}</p><p><b>To:</b> ${email.recipients}</p><p><b>Subject:</b> ${email.subject}</p><p><b>On:</b> ${email.timestamp}</p><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='reply'>Repply</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='unarchive' onclick='unarchive(${email.id})'>Unarchive</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='trash' onclick='trash(${email.id})'>Trash</button><hr><p>${email.body}</p>`;
      }

      // Add card to DOM
      document.querySelector('#view-email').append(view);
    });
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#title-page').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

  // Add a card for each email
  function add_card(email) {

    // Create new card      
    const card = document.createElement('div');
    if (email.read === true) {
      card.style = 'background-color: #eeeeee;';
    } else {
      card.style = 'background-color: white;';
    }    
    card.id = `card-${email.id}`;
    card.className = 'card';    
    if (mailbox === 'inbox') {
      card.innerHTML = `<div class='card-body' onclick='view_email(${email.id}, "inbox")'><h5 class='card-title'>${email.sender}</h5><hr><h6 class='card-subtitle mb-2 text-muted'>${email.subject}</h6><p class='card-subtitle mb-2 text-muted'>${email.timestamp}</p></div><div class='card-footer bg-transparent'><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='trash' onclick='trash(${email.id})'>Trash</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='archive' onclick='archive(${email.id})'>Archive</button></div>`;
    } else if (mailbox === 'sent') {
      card.innerHTML = `<div class='card-body' onclick='view_email(${email.id}, "sent")'><h5 class='card-title'>${email.recipients}</h5><hr><h6 class='card-subtitle mb-2 text-muted'>${email.subject}</h6><p class='card-subtitle mb-2 text-muted'>${email.timestamp}</p></div><div class='card-footer bg-transparent'><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='trash' onclick='trash(${email.id})'>Trash</button>`;
    } else if (mailbox === 'archive') {
      card.innerHTML = `<div class='card-body' onclick='view_email(${email.id}, "archive")'><h5 class='card-title'>${email.sender}</h5><hr><h6 class='card-subtitle mb-2 text-muted'>${email.subject}</h6><p class='card-subtitle mb-2 text-muted'>${email.timestamp}</p></div><div class='card-footer bg-transparent'><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='trash' onclick='trash(${email.id})'>Trash</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='unarchive' onclick='unarchive(${email.id})'>Unarchive</button></div>`;
    } else if (mailbox === 'trash') {
      const me = document.querySelector('#me').innerHTML;
      if (email.sender === me) {
        card.innerHTML = `<div class='card-body' onclick='view_email(${email.id}, "inbox")'><h5 class='card-title'>${email.sender}</h5><hr><h6 class='card-subtitle mb-2 text-muted'>${email.subject}</h6><p class='card-subtitle mb-2 text-muted'>${email.timestamp}</p></div><div class='card-footer bg-transparent'><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='trash' onclick='untrash(${email.id})'>Restore</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-danger' id='delete' onclick='show_delete_email(${email.id})'>Delete</button></div>`;
      } else {
        card.innerHTML = `<div class='card-body' onclick='view_email(${email.id}, "inbox")'><h5 class='card-title'>${email.sender}</h5><hr><h6 class='card-subtitle mb-2 text-muted'>${email.subject}</h6><p class='card-subtitle mb-2 text-muted'>${email.timestamp}</p></div><div class='card-footer bg-transparent'><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='trash' onclick='untrash(${email.id})'>Restore</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-primary' id='archive' onclick='archive(${email.id})'>Archive</button><button style='margin-right: 0.3rem;' class='btn btn-sm btn-outline-danger' id='delete' onclick='show_delete_email(${email.id})'>Delete</button></div>`;
      }
    }
    
    // Add card to DOM
    document.querySelector('#emails-view').append(card);
  }

  if (mailbox === 'sent') {
    document.querySelectorAll(".card").forEach(e => e.remove());
    fetch('/emails/sent')
    .then(response => response.json())
    .then(emails => {
        emails.forEach(add_card);
    });
  } else if (mailbox === 'inbox') {
    document.querySelectorAll(".card").forEach(e => e.remove());
    fetch('/emails/inbox')
    .then(response => response.json())
    .then(emails => {
      emails.forEach(add_card);
      
      // Add the little number of non read emails on the inbox button
      var n_inbox = 0;
      for (let i = 0; i < emails.length; i++) {
        if (emails[i].read === false) {
          n_inbox++;
          if (n_inbox === 0) {
            document.querySelector('#n_inbox').innerHTML = "";
          } else {
            document.querySelector('#n_inbox').innerHTML = n_inbox;
          }
        }
      }
    });
  } else if (mailbox === 'archive') {
    document.querySelectorAll(".card").forEach(e => e.remove());
    fetch('/emails/archive')
    .then(response => response.json())
    .then(emails => {
      emails.forEach(add_card);
    });
  } else if (mailbox === 'trash') {
    document.querySelectorAll(".card").forEach(e => e.remove());
    fetch('/emails/trash')
    .then(response => response.json())
    .then(emails => {
      emails.forEach(add_card);
    });
  }
}


// gertrudinha@bol.com.br chadeboldo
// jao@jao.com.br jao123JAO!@#
// creosnice@ibest.com.br cre123CRE!@#