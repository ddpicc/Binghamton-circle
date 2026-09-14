module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE email_verification_tokens
      MODIFY COLUMN type ENUM('non_edu_onboarding', 'school_email_login')
      NOT NULL DEFAULT 'non_edu_onboarding'
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE email_verification_tokens
      MODIFY COLUMN type ENUM('non_edu_onboarding')
      NOT NULL DEFAULT 'non_edu_onboarding'
    `);
  }
};
